import { Button } from "@bilisound/ui";
import { View } from "@tamagui/core";

export interface PlaylistEditBarProps {
  selectedCount: number;
  isEditLocked: boolean;
  onSelectAll: () => void;
  onSelectReverse: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const PLAYLIST_EDIT_BAR_HEIGHT = 56;

/**
 * 详情页多选编辑底栏，由 v2 `(playlist)/detail/[id].tsx` 内联底栏搬运：
 * 全选 / 反选 / 复制 / 删除，其中在线歌单（isEditLocked）隐藏删除。
 */
export function PlaylistEditBar({
  selectedCount,
  isEditLocked,
  onSelectAll,
  onSelectReverse,
  onCopy,
  onDelete,
}: PlaylistEditBarProps) {
  return (
    <View
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      height={PLAYLIST_EDIT_BAR_HEIGHT}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      gap="$2"
      paddingHorizontal="$2"
      backgroundColor="$surface"
      borderTopWidth={1}
      borderColor="$border"
    >
      <View flexDirection="row" alignItems="center" gap="$2">
        <Button icon="fa6-solid:check-double" variant="ghost" onPress={onSelectAll}>
          全选
        </Button>
        <Button icon="fa6-solid:circle-half-stroke" variant="ghost" onPress={onSelectReverse}>
          反选
        </Button>
        <Button disabled={selectedCount <= 0} icon="fa6-solid:copy" variant="ghost" onPress={onCopy}>
          复制
        </Button>
      </View>
      {isEditLocked ? null : (
        <Button
          aria-label="删除选中曲目"
          disabled={selectedCount <= 0}
          icon="fa6-solid:trash"
          variant="ghost"
          onPress={onDelete}
        >
          删除
        </Button>
      )}
    </View>
  );
}
