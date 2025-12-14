import Monicon from "@monicon/native";
import { usePreventRemove } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Platform, View } from "react-native";
import { DualScrollView } from "~/components/dual-scroll-view";
import { Layout, LayoutButton } from "~/components/layout";
import { Header } from "~/components/playlist-detail/Header";
import { LongPressActions } from "~/components/playlist-detail/LongPressActions";
import { SongItem } from "~/components/song-item";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "~/components/ui/alert-dialog";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { Heading } from "~/components/ui/heading";
import { Input, InputField, InputSlot } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { usePlaylistEditor } from "~/hooks/playlist-detail/usePlaylistEditor";
import { usePlaylistPlayer } from "~/hooks/playlist-detail/usePlaylistPlayer";
import { usePlaylistSearch } from "~/hooks/playlist-detail/usePlaylistSearch";
import { useConfirm } from "~/hooks/useConfirm";
import { useTabSafeAreaInsets } from "~/hooks/useTabSafeAreaInsets";
import { useWindowSize } from "~/hooks/useWindowSize";
import { getPlaylistDetail, getPlaylistMeta } from "~/storage/sqlite/playlist";
import { PlaylistDetail, PlaylistMeta } from "~/storage/sqlite/schema";

function extractAndProcessImgUrls(playlistDetails: PlaylistDetail[]) {
  const imgUrls = playlistDetails.map(detail => detail.imgUrl);
  return Array.from(new Set(imgUrls));
}

export default function Page() {
  const tabSafeAreaEdgeInsets = useTabSafeAreaInsets();
  const { colorValue } = useRawThemeValues();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: metaRaw, refetch: metaRefetch } = useQuery({
    queryKey: [`playlist_meta_${id}`],
    queryFn: () => getPlaylistMeta(Number(id)),
  });

  const meta: PlaylistMeta | undefined = metaRaw?.[0];

  const { data: playlistDetail, refetch: dataRefetch } = useQuery({
    queryKey: [`playlist_detail_${id}`],
    queryFn: () => getPlaylistDetail(Number(id)),
  });

  // 搜索功能
  const { searchQuery, setSearchQuery, filteredPlaylistDetail, getOriginalIndex } = usePlaylistSearch(playlistDetail);

  // 模态框管理
  const { dialogInfo, setDialogInfo, modalVisible, setModalVisible, handleClose, dialogCallback } = useConfirm();

  // 确认对话框包装函数
  const showConfirmDialog = (options: { title: string; description: string; onConfirm: () => Promise<void> }) => {
    setDialogInfo(prevState => ({
      ...prevState,
      title: options.title,
      description: options.description,
    }));
    dialogCallback.current = options.onConfirm;
    setModalVisible(true);
  };

  // 播放逻辑
  const { handlePlay } = usePlaylistPlayer({
    playlistId: Number(id),
    meta,
    filteredPlaylistDetail,
    getOriginalIndex,
    showConfirmDialog,
  });

  // 全部数据是否已经完成加载
  const loaded = meta && playlistDetail;

  // 多选编辑逻辑
  const {
    editing,
    selected,
    isEditLocked,
    toggle,
    handleLongPress,
    handleDelete,
    handleCopy,
    selectAll,
    selectReverse,
    enterEditMode,
    exitEditMode,
  } = usePlaylistEditor({
    playlistId: Number(id),
    meta,
    playlistDetail,
    filteredPlaylistDetail,
    refetchData: async () => {
      await Promise.all([metaRefetch(), dataRefetch()]);
    },
    showConfirmDialog,
  });
  const editingHeight = 56;

  // 返回时先关闭编辑模式
  usePreventRemove(Platform.OS !== "ios" && editing, () => {
    exitEditMode();
  });

  const isDeleteButtonIcon = useWindowSize().width < 768;

  // 菜单管理
  const [showActionSheet, setShowActionSheet] = useState(false);
  // const [showSelectActionSheet, setShowSelectActionSheet] = useState(false);

  const listArea = (playlistDetail?.length || 0) > 0 && (
    <View className="px-4 pb-2">
      <Input className="rounded-xl">
        <InputSlot className="pl-4">
          <Monicon name="fa6-solid:filter" size={16} color={colorValue("--color-primary-500")} />
        </InputSlot>
        <InputField
          placeholder="过滤歌曲或作者……"
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
            <Monicon name="fa6-solid:xmark" size={20} color={colorValue("--color-typography-700")} />
          </InputSlot>
        )}
      </Input>
      {searchQuery.trim() && (
        <View className="flex-row items-center justify-between mt-3 px-1">
          <Text className="text-sm text-typography-500">过滤后有 {filteredPlaylistDetail.length} 首歌曲</Text>
        </View>
      )}
    </View>
  );

  return (
    <Layout
      title={"查看详情"}
      leftAccessories={"BACK_BUTTON"}
      rightAccessories={
        editing ? (
          <LayoutButton iconName={"fa6-solid:check"} aria-label={"完成"} onPress={exitEditMode} />
        ) : (
          <LayoutButton
            iconName={"fa6-solid:ellipsis-vertical"}
            onPress={() => {
              setShowActionSheet(true);
            }}
          />
        )
      }
      edgeInsets={{ ...tabSafeAreaEdgeInsets, bottom: 0 }}
    >
      {/* 内容区 */}
      {loaded ? (
        <DualScrollView
          edgeInsets={{ left: 0, right: 0, top: 0, bottom: 0 }}
          header={
            <Header
              meta={meta}
              detail={playlistDetail}
              images={extractAndProcessImgUrls(playlistDetail)}
              showPlayButton={playlistDetail.length > 0}
              onPlay={() => handlePlay()}
            />
          }
          headerContainerStyle={{
            paddingBottom: tabSafeAreaEdgeInsets.bottom + 16,
          }}
          list={({ contentContainerStyle }) => (
            <FlashList
              contentContainerStyle={{
                ...contentContainerStyle,
                paddingBottom: tabSafeAreaEdgeInsets.bottom + (editing ? editingHeight : 0),
              }}
              scrollIndicatorInsets={{
                bottom: Number.MIN_VALUE,
              }}
              data={filteredPlaylistDetail}
              extraData={[editing, selected.size, searchQuery]}
              renderItem={({ item, index }) => (
                <SongItem
                  data={item}
                  index={index + 1}
                  onRequestPlay={() => handlePlay(index)}
                  onToggle={() => toggle(index)}
                  onLongPress={() => handleLongPress(index)}
                  isChecking={editing}
                  isChecked={selected.has(index)}
                />
              )}
              ListHeaderComponent={
                <View>
                  <Header
                    className={"flex sm:hidden px-4 pb-4"}
                    meta={meta}
                    detail={playlistDetail}
                    images={extractAndProcessImgUrls(playlistDetail || [])}
                    showPlayButton={(playlistDetail?.length || 0) > 0}
                    onPlay={() => handlePlay()}
                  />
                  {/* 搜索输入框 */}
                  {listArea}
                </View>
              }
            />
          )}
        />
      ) : null}

      {loaded ? (
        <View
          className={`bg-background-0 border-t border-background-50 ${editing ? "flex" : "hidden"} absolute left-0 bottom-0 w-full`}
          style={{ height: tabSafeAreaEdgeInsets.bottom + editingHeight }}
        >
          <View className={"flex-row items-center justify-between gap-2 px-2"} style={{ height: editingHeight }}>
            <View className={"flex-row items-center gap-2"}>
              <ButtonOuter>
                <Button variant={"ghost"} onPress={selectAll} className={"px-4"}>
                  <ButtonMonIcon name={"fa6-solid:check-double"} />
                  <ButtonText>全选</ButtonText>
                </Button>
              </ButtonOuter>
              <ButtonOuter>
                <Button variant={"ghost"} onPress={selectReverse} className={"px-4"}>
                  <ButtonMonIcon name={"fa6-solid:circle-half-stroke"} />
                  <ButtonText>反选</ButtonText>
                </Button>
              </ButtonOuter>
              <ButtonOuter>
                <Button variant={"ghost"} onPress={() => handleCopy()} className={"px-4"}>
                  <ButtonMonIcon name={"fa6-solid:copy"} />
                  <ButtonText>复制</ButtonText>
                </Button>
              </ButtonOuter>
            </View>
            <View className={"flex-row items-center gap-2"}>
              {isEditLocked ? null : (
                <ButtonOuter>
                  <Button
                    variant={"ghost"}
                    onPress={() => handleDelete()}
                    className={"px-4"}
                    disabled={selected.size <= 0}
                    icon={isDeleteButtonIcon}
                    aria-label={"删除"}
                  >
                    <ButtonMonIcon name={"fa6-solid:trash"} />
                    <ButtonText className={"hidden sm:flex"}>删除</ButtonText>
                  </Button>
                </ButtonOuter>
              )}
              {/*<ButtonOuter>
                                <Button
                                    variant={"ghost"}
                                    onPress={() => setShowSelectActionSheet(true)}
                                    className={"px-4"}
                                    disabled={selected.size <= 0}
                                    aria-label={"更多操作"}
                                    icon
                                >
                                    <ButtonMonIcon name={"fa6-solid:ellipsis-vertical"} />
                                </Button>
                            </ButtonOuter>*/}
            </View>
          </View>
        </View>
      ) : null}

      {/* 用户警告框 */}
      <AlertDialog isOpen={modalVisible} onClose={() => handleClose(false)} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold" size="lg">
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

      <LongPressActions
        onAction={action => {
          setShowActionSheet(false);
          switch (action) {
            case "editMeta":
              router.push(`/(main)/(playlist)/meta/${id}`);
              break;
            case "editCover":
              router.push(`/utils/cover-picker?listId=${id}`);
              break;
            case "editMass":
              enterEditMode();
              break;
            case "close":
            default:
              break;
          }
        }}
        onClose={() => setShowActionSheet(false)}
        showActionSheet={showActionSheet}
        current={meta}
      />

      {/*<SelectActions
                onAction={() => {}}
                onClose={() => setShowSelectActionSheet(false)}
                showActionSheet={showSelectActionSheet}
                current={(playlistDetail ?? []).filter((_, i) => selected.has(i))}
            />*/}
    </Layout>
  );
}
