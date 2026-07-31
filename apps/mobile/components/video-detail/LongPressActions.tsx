import { getVideoImageUrl, getVideoUrl, type VideoMetadata } from "~/features/bilibili";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "~/components/ui/actionsheet";
import { ActionSheetCurrent } from "~/components/action-sheet-current";
import { ActionMenu, ActionMenuItem } from "~/components/action-menu";
import { useDownloadMenuItem } from "~/hooks/useDownloadMenuItem";
import { formatSecond } from "~/utils/datetime";
import type { PageItem } from "./helpers";

export type LongPressAction = "addPlaylist" | "addPlaylistRecent" | "close";

export interface LongPressActionsProps {
  showActionSheet: boolean;
  displayTrack: PageItem;
  onClose: () => void;
  onAction: (action: LongPressAction) => void;
  data: VideoMetadata;
}

export function LongPressActions({ showActionSheet, displayTrack, onAction, onClose, data }: LongPressActionsProps) {
  const menuItems: ActionMenuItem[] = [
    ...useDownloadMenuItem(
      {
        title: displayTrack.title,
        artist: data.owner.name ?? "",
        artworkUri: data.coverUrl ?? "",
        duration: displayTrack.duration ?? 0,
        extendedData: {
          id: data.bvid,
          episode: displayTrack.page,
          isLoaded: false,
          expireAt: 0,
          artworkUrl: data.coverUrl,
        },
        headers: {},
        id: "",
        mimeType: "",
        uri: "",
      },
      () => onClose(),
    ),
    {
      text: "添加到歌单",
      icon: "fa6-solid:plus",
      iconSize: 16,
      show: true,
      action() {
        onAction("addPlaylist");
      },
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:xmark",
      iconSize: 20,
      text: "取消",
      action: () => {
        onAction("close");
      },
    },
  ];

  return (
    <Actionsheet isOpen={showActionSheet} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {displayTrack && data && (
          <ActionSheetCurrent
            line1={displayTrack.title}
            line2={formatSecond(displayTrack.duration)}
            image={getVideoImageUrl(data.coverUrl, getVideoUrl(data.bvid))}
          />
        )}
        <ActionMenu menuItems={menuItems} />
      </ActionsheetContent>
    </Actionsheet>
  );
}
