import React, { useContext } from "react";
import { InsidePageContext } from "~/components/main-bottom-sheet/utils";
import { useCurrentTrack } from "@bilisound/player";
import { useActionSheetStore } from "~/components/main-bottom-sheet/stores";
import { usePlaybackSpeedStore } from "~/store/playback-speed";
import { useBottomSheetStore } from "~/store/bottom-sheet";
import { router } from "expo-router";
import { openAddPlaylistPage } from "~/business/playlist/misc";
import { View } from "react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "~/components/ui/actionsheet";
import { ActionSheetCurrent } from "~/components/action-sheet-current";
import { formatSecond } from "~/utils/datetime";
import { SPEED_PRESETS } from "~/components/main-bottom-sheet/constants";
import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "~/components/ui/checkbox";
import { CheckIcon } from "~/components/ui/icon";
import { SpeedControlPanel } from "./speed-control-panel";
import { useDownloadMenuItem } from "~/hooks/useDownloadMenuItem";
import { ActionMenu, ActionMenuItem } from "~/components/action-menu";
import { Text } from "~/components/ui/text";

export function PlayerControlMenu() {
  const isInsidePage = useContext(InsidePageContext);
  const currentTrack = useCurrentTrack();
  const { showActionSheet, showSpeedActionSheet, handleClose, handleSpeedClose, setShowSpeedActionSheet } =
    useActionSheetStore(state => ({
      showActionSheet: state.showActionSheet,
      showSpeedActionSheet: state.showSpeedActionSheet,
      handleClose: state.handleClose,
      handleSpeedClose: state.handleSpeedClose,
      setShowSpeedActionSheet: state.setShowSpeedActionSheet,
    }));
  const { speedValue, retainPitch, applySpeed } = usePlaybackSpeedStore(state => ({
    speedValue: state.speedValue,
    retainPitch: state.retainPitch,
    applySpeed: state.applySpeed,
  }));

  const menuItems: ActionMenuItem[] = [
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:eye",
      iconSize: 16,
      text: "查看详情",
      action: () => {
        if (!currentTrack?.extendedData) {
          return;
        }
        handleClose();
        if (!isInsidePage) {
          useBottomSheetStore.getState().close();
        }
        setTimeout(
          () => {
            router.navigate(`/video/${currentTrack.extendedData?.id}`);
          },
          isInsidePage ? 0 : 250,
        );
      },
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:plus",
      iconSize: 18,
      text: "添加到歌单",
      action: () => {
        if (!currentTrack?.extendedData) {
          return;
        }
        handleClose();
        console.log(isInsidePage);
        if (!isInsidePage) {
          useBottomSheetStore.getState().close();
        }
        setTimeout(
          () => {
            openAddPlaylistPage({
              name: currentTrack.title ?? "",
              description: "",
              playlistDetail: [
                {
                  author: currentTrack.artist ?? "",
                  bvid: currentTrack.extendedData?.id ?? "",
                  duration: currentTrack.duration ?? 0,
                  episode: currentTrack.extendedData?.episode ?? 1,
                  title: currentTrack.title ?? "",
                  imgUrl: currentTrack.extendedData?.artworkUrl ?? "",
                  id: 0,
                  playlistId: 0,
                  extendedData: null,
                },
              ],
              cover: currentTrack.artworkUri ?? "",
            });
          },
          isInsidePage ? 0 : 250,
        );
      },
    },
    ...useDownloadMenuItem(currentTrack, () => handleClose()),
    {
      show: true,
      disabled: false,
      icon: "material-symbols:speed-rounded",
      iconSize: 20,
      text: "调节播放速度",
      action: () => {
        handleClose();
        setShowSpeedActionSheet(true);
      },
    },
    {
      show: process.env.NODE_ENV === "development",
      disabled: false,
      icon: "fa6-solid:bug",
      iconSize: 18,
      text: "打印 currentTrack 到控制台",
      action: () => {
        console.log(JSON.stringify(currentTrack, null, 4));
      },
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:xmark",
      iconSize: 20,
      text: "取消",
      action: () => {
        handleClose();
      },
    },
  ];

  return (
    <>
      {/* 操作菜单 */}
      <Actionsheet isOpen={showActionSheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          {!!currentTrack && (
            <ActionSheetCurrent
              line1={currentTrack.title ?? ""}
              line2={formatSecond(currentTrack.duration ?? 0)}
              image={currentTrack.artworkUri}
            />
          )}
          <ActionMenu menuItems={menuItems} />
        </ActionsheetContent>
      </Actionsheet>

      {/* 速度菜单 */}
      <Actionsheet isOpen={showSpeedActionSheet} onClose={handleSpeedClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <View className={"w-full px-4 pt-4 pb-6"}>
            {/*<Text className={"font-semibold text-lg leading-tight"}>调节播放速度</Text>*/}
            <SpeedControlPanel />
            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
              {SPEED_PRESETS.map(item => {
                const button = (
                  <ButtonOuter key={item.text}>
                    <Button
                      className={"w-14 p-0"}
                      variant={"outline"}
                      size={"sm"}
                      onPress={() => {
                        applySpeed(item.speed, retainPitch);
                      }}
                    >
                      <ButtonText>{item.text}</ButtonText>
                    </Button>
                  </ButtonOuter>
                );

                if (item.speed === 1) {
                  return (
                    <View className={"gap-1 items-center"} key={item.text}>
                      {button}
                      <Text className={"text-primary-500 text-xs"}>正常速度</Text>
                    </View>
                  );
                }

                return button;
              })}
            </View>
            <Checkbox
              size="md"
              isInvalid={false}
              isDisabled={false}
              value={""}
              isChecked={retainPitch}
              onChange={e => {
                applySpeed(speedValue, e);
              }}
              className={"mt-4"}
            >
              <CheckboxIndicator>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel className={"text-sm"}>变速不变调</CheckboxLabel>
            </Checkbox>
          </View>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
