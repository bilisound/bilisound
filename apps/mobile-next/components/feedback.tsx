import { useEffect } from "react";
import { Button, HStack, Text, VStack } from "@bilisound/ui";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useErrorMessageStore from "~/store/error-message";

export function notify(message: string, error = false) {
  Toast.show({ type: error ? "error" : "success", text1: message });
}

export function reportError(error: unknown) {
  notify(error instanceof Error ? error.message : String(error), true);
}

export function FeedbackHost() {
  const message = useErrorMessageStore(state => state.message);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    notify(message, true);
    useErrorMessageStore.getState().setMessage(null);
  }, [message]);
  const render = ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <HStack backgroundColor="$surface" borderColor="$border" borderWidth={1} borderRadius="$4" padding="$3" gap="$2" maxWidth="95%" accessibilityRole="alert">
      <VStack flex={1} gap="$1"><Text>{text1}</Text>{text2 ? <Text size="sm">{text2}</Text> : null}</VStack>
      <Button variant="ghost" size="sm" accessibilityLabel="关闭提示" onPress={() => Toast.hide()}>关闭</Button>
    </HStack>
  );
  return <Toast config={{ success: render, error: render, info: render }} topOffset={insets.top + 12} />;
}
