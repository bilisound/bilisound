import { useState } from "react";
import { Linking, Platform } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { pause } from "@bilisound/player";
import { GetMetadataResponse } from "@bilisound/sdk";

import { LayoutButton } from "~/components/layout";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "~/components/ui/actionsheet";
import { ActionSheetCurrent } from "~/components/action-sheet-current";
import { ActionMenu, ActionMenuItem } from "~/components/action-menu";
import { getImageProxyUrl } from "~/business/constant-helper";
import { getBilisoundResourceUrlOnline } from "~/api/bilisound";
import useSettingsStore from "~/store/settings";

export type PageMenuAction = "addPlaylist";

export interface PageMenuProps {
  data: GetMetadataResponse;
  onAction: (action: PageMenuAction) => void;
}

export function PageMenu({ data, onAction }: PageMenuProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);

  function onClose() {
    setShowActionSheet(false);
  }

  const menuItems: ActionMenuItem[] = [
    {
      text: "添加到歌单",
      icon: "fa6-solid:plus",
      iconSize: 16,
      show: true,
      action() {
        onAction("addPlaylist");
        onClose();
      },
    },
    {
      show: Platform.OS === "web",
      text: "下载",
      icon: "fa6-solid:download",
      iconSize: 18,
      action() {
        onClose();
        if (!data) {
          return;
        }
        if (data.pages.length === 1) {
          globalThis.window.open(
            getBilisoundResourceUrlOnline(data.bvid, 1, useSettingsStore.getState().useLegacyID ? "av" : "bv").url,
          );
          return;
        }
        router.navigate(`/download-web?id=${data.bvid}`);
      },
    },
    {
      text: "在浏览器打开",
      icon: "fa6-solid:link",
      iconSize: 16,
      show: true,
      async action() {
        await pause();
        await Linking.openURL("https://www.bilibili.com/video/" + data.bvid + "/");
        onClose();
      },
    },
    {
      text: "复制视频链接",
      icon: "fa6-solid:copy",
      show: true,
      async action() {
        await Clipboard.setStringAsync("https://www.bilibili.com/video/" + data.bvid + "/");
        Toast.show({
          type: "success",
          text1: "视频链接已复制到剪贴板",
        });
        onClose();
      },
    },
    {
      text: "取消",
      icon: "fa6-solid:xmark",
      iconSize: 20,
      show: true,
      action() {
        onClose();
      },
    },
  ];

  return (
    <>
      <LayoutButton iconName={"fa6-solid:ellipsis-vertical"} onPress={() => setShowActionSheet(true)} />
      <Actionsheet isOpen={showActionSheet} onClose={onClose} style={{ zIndex: 999 }}>
        <ActionsheetBackdrop />
        <ActionsheetContent style={{ zIndex: 999 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionSheetCurrent
            line1={data.title}
            line2={data.owner.name}
            image={getImageProxyUrl(data.pic, "https://www.bilibili.com/video/" + data.bvid)}
          />
          <ActionMenu menuItems={menuItems} />
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
