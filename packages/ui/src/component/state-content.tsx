import { ActivityIndicator } from "react-native";
import { useTheme, View } from "@tamagui/core";

import { Button } from "./button";
import { Text } from "./text";

export interface StateContentProps {
  title: string;
  description?: string;
  /** Shows a spinner until the state resolves. */
  loading?: boolean;
  /** When set (and not loading), renders a retry button. */
  onRetry?: () => void;
}

/**
 * Centered placeholder for empty / error / loading page states.
 *
 * Pure presentation: the caller owns the copy and the retry policy. The retry
 * button only appears once loading has finished.
 */
export function StateContent({ title, description, loading = false, onRetry }: StateContentProps) {
  const theme = useTheme();

  return (
    <View alignItems="center" flex={1} gap="$3" justifyContent="center" padding="$6">
      {loading ? <ActivityIndicator color={theme.textMuted.get()} /> : null}
      <Text color="$text" semiBold size="lg" textAlign="center">
        {title}
      </Text>
      {description ? <Text textAlign="center">{description}</Text> : null}
      {!loading && onRetry ? <Button onPress={onRetry}>重试</Button> : null}
    </View>
  );
}
