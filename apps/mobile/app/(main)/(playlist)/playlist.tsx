import { Icon } from "~/components/icon";
import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import Fuse from "fuse.js";
import React, { createContext, useContext, useMemo, useState } from "react";
import Toast from "react-native-toast-message";
import { getImageProxyUrl } from "~/business/constant-helper";
import { ActionMenu, ActionMenuItem } from "~/components/action-menu"; // Fixing the import path for ActionMenu and ActionMenuItem components
import { ActionSheetCurrent } from "~/components/action-sheet-current";
import { Layout, LayoutButton } from "~/components/layout";
import { PlaylistItem } from "~/components/playlist-item";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "~/components/ui/actionsheet";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "~/components/ui/alert-dialog";
import { Box } from "~/components/ui/box";
import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { Heading } from "~/components/ui/heading";
import { Input, InputField, InputSlot } from "~/components/ui/input";
import { Menu, MenuItem, MenuItemLabel } from "~/components/ui/menu";
import { Text } from "~/components/ui/text";
import { useConfirm } from "~/hooks/useConfirm";
import { useTabSafeAreaInsets } from "~/hooks/useTabSafeAreaInsets";
import { useWindowSize } from "~/hooks/useWindowSize";
import { invalidateOnQueueStatus, PLAYLIST_ON_QUEUE, playlistStorage } from "~/storage/playlist";
import { deletePlaylistMeta, getPlaylistMetas } from "~/storage/sqlite/playlist";
import { PlaylistMeta } from "~/storage/sqlite/schema";
import useSettingsStore from "~/store/settings";
import { exportPlaylistToFile, importPlaylistFromFile } from "~/utils/exchange/playlist";
import log from "~/utils/logger";
import { padArrayToColumns } from "~/utils/misc";

interface PlaylistContextProps {
  onLongPress: (id: number) => void;
  width: number;
  columns: number;
}

const PlaylistContext = createContext<PlaylistContextProps>({
  columns: 0,
  onLongPress: () => {},
  width: 0,
});

function PlaylistActionItem(item: PlaylistMeta & { grid: boolean }) {
  const { onLongPress } = useContext(PlaylistContext);

  return (
    <PlaylistItem
      item={item}
      onPress={() => {
        router.push(`/(main)/(playlist)/detail/${item.id}`);
      }}
      onLongPress={() => {
        onLongPress(item.id);
      }}
      grid={item.grid}
    />
  );
}

interface LongPressActionsProps {
  showActionSheet: boolean;
  displayTrack?: PlaylistMeta;
  onClose: () => void;
  onAction: (action: "delete" | "close" | "edit" | "editCover" | "export") => void;
}

/**
 * 长按操作
 */
function LongPressActions({ showActionSheet, displayTrack, onAction, onClose }: LongPressActionsProps) {
  const showEditCover = !displayTrack?.source;

  const menuItems: ActionMenuItem[] = [
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:pen",
      iconSize: 18,
      text: "修改信息",
      action: () => onAction("edit"),
    },
    {
      show: showEditCover && (displayTrack?.amount ?? 0) > 0,
      disabled: false,
      icon: "fa6-solid:images",
      iconSize: 18,
      text: "修改封面",
      action: () => onAction("editCover"),
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:trash",
      iconSize: 18,
      text: "删除",
      action: () => onAction("delete"),
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:file-export",
      iconSize: 18,
      text: "导出",
      action: () => onAction("export"),
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:xmark",
      iconSize: 20,
      text: "取消",
      action: () => onAction("close"),
    },
  ];

  return (
    <Actionsheet isOpen={showActionSheet} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="z-50">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {!!displayTrack && (
          <ActionSheetCurrent
            line1={displayTrack.title}
            line2={`${displayTrack.amount} 首歌曲`}
            image={getImageProxyUrl(displayTrack.imgUrl!)}
          />
        )}
        <ActionMenu menuItems={menuItems} />
      </ActionsheetContent>
    </Actionsheet>
  );
}

export default function Page() {
  const edgeInsets = useTabSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colorValue } = useRawThemeValues();
  const { data } = useQuery({
    queryKey: ["playlist_meta"],
    queryFn: () => getPlaylistMetas(),
  });

  const handleImport = async () => {
    const result = await importPlaylistFromFile();
    if (result) {
      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });
    }
  };

  // 搜索过滤功能
  const [searchQuery, setSearchQuery] = useState("");

  // 创建 Fuse 实例
  const fuse = useMemo(() => {
    if (!data || data.length === 0) return null;
    return new Fuse(data, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "description", weight: 0.3 },
      ],
      threshold: 0.3, // 模糊匹配阈值，0.3 表示相对宽松的匹配
      includeScore: true,
      ignoreFieldNorm: true,
      ignoreLocation: true,
    });
  }, [data]);

  // 过滤后的播放列表数据
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim() || !fuse) return data;

    const results = fuse.search(searchQuery.trim());
    return results.map(result => result.item);
  }, [data, searchQuery, fuse]);

  // 布局管理
  const windowDimensions = useWindowSize();
  let windowWidth = windowDimensions.width;
  if (windowDimensions.width >= 768) {
    windowWidth = windowDimensions.width - 64;
  }
  if (windowDimensions.width >= 1280) {
    windowWidth = windowDimensions.width - 256;
  }
  if (windowDimensions.width >= 1536) {
    windowWidth = 1280;
  }
  const { showPlaylistInGrid, toggle } = useSettingsStore(state => ({
    showPlaylistInGrid: state.showPlaylistInGrid,
    toggle: state.toggle,
  }));
  const columns = showPlaylistInGrid ? Math.max(Math.floor(windowWidth / 200), 2) : windowWidth > 1024 ? 2 : 1;
  const gridSidePadding = windowWidth >= 448 ? 12 : 8;
  const [width, setWidth] = useState(0);

  // 模态框管理
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [displayTrack, setDisplayTrack] = useState<PlaylistMeta | undefined>();
  const { dialogInfo, setDialogInfo, modalVisible, setModalVisible, handleClose, dialogCallback } = useConfirm();

  const handleActionSheetClose = () => setShowActionSheet(prevState => !prevState);

  const handleLongPress = (id: number) => {
    setDisplayTrack(data?.find(e => e.id === id));
    setShowActionSheet(true);
  };

  const handleDelete = async () => {
    dialogCallback.current = async () => {
      log.info("用户删除歌单");
      await deletePlaylistMeta(displayTrack!.id);
      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });

      // 清空当前播放队列隶属歌单的状态机
      const got: { value?: PlaylistMeta } = JSON.parse(playlistStorage.getString(PLAYLIST_ON_QUEUE) || "{}");
      if (got?.value?.id === displayTrack?.id) {
        invalidateOnQueueStatus();
      }

      Toast.show({
        type: "success",
        text1: "歌单删除成功",
        text2: displayTrack?.title,
      });
    };
    setDialogInfo(e => ({
      ...e,
      title: "删除歌单确认",
      description: `确定要删除歌单「${displayTrack?.title}」吗？`,
    }));
    setModalVisible(true);
  };

  return (
    <PlaylistContext.Provider value={{ onLongPress: handleLongPress, width, columns }}>
      <Layout
        edgeInsets={{ ...edgeInsets, bottom: 0 }}
        title={"歌单"}
        leftAccessories={
          <LayoutButton
            iconName={showPlaylistInGrid ? "mingcute:grid-fill" : "fa6-solid:list"}
            aria-label={"扫描二维码"}
            iconSize={showPlaylistInGrid ? 24 : 20}
            onPress={() => {
              toggle("showPlaylistInGrid");
            }}
          />
        }
        rightAccessories={
          <>
            <LayoutButton
              iconName={"uil:qrcode-scan"}
              aria-label={"扫描二维码"}
              iconSize={22}
              onPress={() => {
                router.navigate("/barcode");
              }}
            />
            <Menu
              placement="bottom right"
              offset={5}
              disabledKeys={["Settings"]}
              trigger={({ ...triggerProps }) => {
                return <LayoutButton iconName={"fa6-solid:plus"} aria-label={"添加或导入歌单"} {...triggerProps} />;
              }}
            >
              <MenuItem
                key="create"
                textValue="创建新歌单"
                onPress={() => {
                  router.navigate("/(main)/(playlist)/meta/new");
                }}
              >
                <Box className={"size-4 items-center justify-center mr-3"}>
                  <Icon name={"fa6-solid:plus"} size={16} className={"text-typography-700"} />
                </Box>
                <MenuItemLabel>创建新歌单</MenuItemLabel>
              </MenuItem>
              <MenuItem key="import" textValue="导入歌单" onPress={handleImport}>
                <Box className={"size-4 items-center justify-center mr-3"}>
                  <Icon name={"fa6-solid:file-import"} size={16} className={"text-typography-700"} />
                </Box>
                <MenuItemLabel>导入歌单</MenuItemLabel>
              </MenuItem>
            </Menu>
          </>
        }
      >
        <View className={"flex-1 @container"}>
          {/* 搜索过滤组件 */}
          {(data || []).length > 0 && (
            <View className="px-4 pb-2">
              <Input className="rounded-xl">
                <InputSlot className="pl-4">
                  <Icon name="fa6-solid:filter" size={16} color={colorValue("--color-primary-500")} />
                </InputSlot>
                <InputField
                  placeholder="过滤歌单标题或描述……"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-sm px-3"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                />
                {searchQuery.length > 0 && (
                  <InputSlot
                    className="h-12 px-3 items-center justify-center"
                    onPress={() => {
                      setSearchQuery("");
                    }}
                  >
                    <Icon name="fa6-solid:xmark" size={20} color={colorValue("--color-typography-700")} />
                  </InputSlot>
                )}
              </Input>
              {searchQuery.trim() && (
                <View className="flex-row items-center justify-between mt-3 px-1">
                  <Text className="text-sm text-typography-500">过滤后有 {filteredData.length} 个歌单</Text>
                </View>
              )}
            </View>
          )}

          {(data || []).length > 0 ? (
            <View style={{ flex: 1 }}>
              <FlashList
                key={columns}
                // https://stackoverflow.com/questions/43502954/react-native-flatlist-with-columns-last-item-width
                data={padArrayToColumns(filteredData, columns)}
                renderItem={({ item }) => {
                  if (!item) {
                    return <View className={"p-2 @md:p-3 flex-1"} />;
                  }

                  return <PlaylistActionItem grid={showPlaylistInGrid} {...item} />;
                }}
                numColumns={columns}
                onLayout={e => {
                  setWidth(e.nativeEvent.layout.width);
                }}
                contentContainerStyle={{
                  paddingHorizontal: showPlaylistInGrid ? gridSidePadding : 0,
                  paddingBottom: edgeInsets.bottom,
                }}
                extraData={[showPlaylistInGrid, searchQuery]}
                keyExtractor={(item, index) => {
                  if (!item) {
                    return "placeholder-" + index;
                  }
                  return item.id.toString();
                }}
              />
            </View>
          ) : (
            <View className={"flex-1 items-center justify-center gap-4"}>
              <Text className={"leading-normal text-sm font-semibold color-typography-500"}>这里空空如也</Text>
              <ButtonOuter>
                <Button onPress={() => router.navigate("/")}>
                  <ButtonText>去查询</ButtonText>
                </Button>
              </ButtonOuter>
            </View>
          )}
        </View>

        {/* 操作菜单 */}
        <LongPressActions
          showActionSheet={showActionSheet}
          onClose={handleActionSheetClose}
          displayTrack={displayTrack}
          onAction={action => {
            setShowActionSheet(false);
            switch (action) {
              case "delete":
                handleDelete();
                break;
              case "close":
                break;
              case "edit":
                router.push(`./meta/${displayTrack?.id}`);
                break;
              case "editCover":
                router.push(`/utils/cover-picker?listId=${displayTrack?.id}`);
                break;
              case "export":
                if (displayTrack?.id) {
                  exportPlaylistToFile(displayTrack.id);
                }
                break;
              default:
                break;
            }
          }}
        />

        {/* 对话框 */}
        <AlertDialog isOpen={modalVisible} onClose={() => handleClose(false)} size="md">
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Heading className="text-typography-950 font-semibold" size="md">
                {dialogInfo.title}
              </Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text size="sm" className="leading-normal">
                {dialogInfo.description}
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <ButtonOuter>
                <Button variant="ghost" onPress={() => handleClose(false)}>
                  <ButtonText>{dialogInfo.cancel}</ButtonText>
                </Button>
              </ButtonOuter>
              <ButtonOuter>
                <Button onPress={() => handleClose(true)}>
                  <ButtonText>{dialogInfo.ok}</ButtonText>
                </Button>
              </ButtonOuter>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </PlaylistContext.Provider>
  );
}
