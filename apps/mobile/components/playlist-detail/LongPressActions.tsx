import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "~/components/ui/actionsheet";
import { ActionSheetCurrent } from "~/components/action-sheet-current";
import { ActionMenu, ActionMenuItem } from "~/components/action-menu";
import { PlaylistMeta } from "~/storage/sqlite/schema";
import { getImageProxyUrl } from "~/business/constant-helper";

export type LongPressAction = "editMeta" | "editCover" | "editMass" | "close";

export interface LongPressActionsProps {
  showActionSheet: boolean;
  onClose: () => void;
  onAction: (action: LongPressAction) => void;
  current?: PlaylistMeta;
}

export function LongPressActions({ showActionSheet, onAction, onClose, current }: LongPressActionsProps) {
  const showEditCover = !current?.source;

  const menuItems: ActionMenuItem[] = [
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:pen",
      iconSize: 18,
      text: "修改信息",
      action: () => onAction("editMeta"),
    },
    {
      show: showEditCover && (current?.amount ?? 0) > 0,
      disabled: false,
      icon: "fa6-solid:images",
      iconSize: 18,
      text: "修改封面",
      action: () => onAction("editCover"),
    },
    {
      show: true,
      disabled: false,
      icon: "fa6-solid:list-check",
      iconSize: 18,
      text: "批量管理",
      action: () => onAction("editMass"),
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
    <Actionsheet isOpen={showActionSheet} onClose={onClose} style={{ zIndex: 999 }}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={{ zIndex: 999 }}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        {!!current && (
          <ActionSheetCurrent
            line1={current.title}
            line2={`${current.amount} 首歌曲`}
            image={current?.imgUrl ? getImageProxyUrl(current.imgUrl) : undefined}
          />
        )}
        <ActionMenu menuItems={menuItems} />
      </ActionsheetContent>
    </Actionsheet>
  );
}
