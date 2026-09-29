import type { IconName } from "@bilisound/ui";
import { ActionMenu, Text } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { Image } from "expo-image";

export interface PlaylistSheetAction {
  id: string;
  text: string;
  icon: IconName;
  iconSize?: number;
  disabled?: boolean;
  show?: boolean;
  onPress: () => void;
}

export interface PlaylistSheetSummary {
  line1: string;
  line2?: string;
  image?: string;
}

export interface PlaylistActionSheetProps {
  open: boolean;
  actions: PlaylistSheetAction[];
  summary?: PlaylistSheetSummary;
  onClose: () => void;
}

/**
 * 歌单长按操作面板（列表页 / 详情页共用）。
 *
 * v2 的两处操作面板（`LongPressActions`）都基于 ActionSheet + 当前项摘要 +
 * 菜单项，这里统一收口到一个组件：菜单项点击后先执行动作再关闭面板，
 * 与 v2 Actionsheet 的行为一致。
 */
export function PlaylistActionSheet({ open, actions, summary, onClose }: PlaylistActionSheetProps) {
  return (
    <ActionMenu
      open={open}
      onOpenChange={(value: boolean) => {
        if (!value) {
          onClose();
        }
      }}
      header={summary ? <PlaylistActionSummary {...summary} /> : undefined}
      menuItems={actions.map(action => ({
        id: action.id,
        text: action.text,
        icon: action.icon,
        iconSize: action.iconSize,
        show: action.show,
        disabled: action.disabled,
        action: () => {
          onClose();
          action.onPress();
        },
      }))}
    />
  );
}

function PlaylistActionSummary({ line1, line2, image }: PlaylistSheetSummary) {
  return (
    <View flexDirection="row" alignItems="center" gap="$4" paddingHorizontal="$4" paddingVertical="$4" width="100%">
      {image ? <Image source={image} style={{ height: 48, width: 72, borderRadius: 12 }} contentFit="cover" /> : null}
      <View flex={1} gap="$1" minWidth={0}>
        <Text color="$text" semiBold truncated>
          {line1}
        </Text>
        {line2 ? (
          <Text color="$textMuted" size="sm" truncated>
            {line2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
