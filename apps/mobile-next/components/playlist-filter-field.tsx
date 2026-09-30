import { Button, Icon, Text, TextInput } from "@bilisound/ui";
import { isWeb, useTheme, View } from "@tamagui/core";

export interface PlaylistFilterFieldProps {
  value: string;
  placeholder: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  /** 过滤生效时展示的结果计数文案。 */
  resultLabel?: string;
  onChangeText: (value: string) => void;
}

/**
 * 歌单 / 曲目搜索过滤行，替代 v2 `TextField + TextFieldAction` 组合。
 * 输入框左侧固定 filter 图标，有内容时展示清空按钮与结果计数。
 */
export function PlaylistFilterField({
  value,
  placeholder,
  accessibilityLabel,
  accessibilityHint,
  resultLabel,
  onChangeText,
}: PlaylistFilterFieldProps) {
  const theme = useTheme();
  const filtering = value.trim().length > 0;

  return (
    <View paddingHorizontal="$4" paddingBottom="$2" gap="$2">
      <View flexDirection="row" alignItems="center" gap="$2">
        <Icon name="fa6-solid:filter" size={16} color={theme.primaryText.get()} />
        <View flex={1} minWidth={0}>
          <TextInput
            aria-label={accessibilityLabel}
            // Web 没有可引用的描述节点，hint 保持 native-only（RN 未提供 aria-describedby）。
            {...(isWeb ? null : { accessibilityHint: accessibilityHint })}
            onChangeText={onChangeText}
            placeholder={placeholder}
            size="md"
            value={value}
          />
        </View>
        {filtering ? (
          <Button
            aria-label="清空过滤条件"
            icon="fa6-solid:xmark"
            shape="rounded"
            variant="ghost"
            onPress={() => onChangeText("")}
          />
        ) : null}
      </View>
      {filtering && resultLabel ? (
        <Text color="$textMuted" size="sm">
          {resultLabel}
        </Text>
      ) : null}
    </View>
  );
}
