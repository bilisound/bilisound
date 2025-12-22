import { View } from "react-native";
import { Icon } from "~/components/icon";
import { Text } from "~/components/ui/text";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";

export interface ErrorContentProps {
  message: string;
}

export function ErrorContent({ message }: ErrorContentProps) {
  const { colorValue } = useRawThemeValues();

  return (
    <View className={"gap-4 items-center p-4"}>
      <Icon name={"tabler:alert-square-rounded"} color={colorValue("--color-typography-400")} size={64} />
      <Text className={"color-typography-400 text-base leading-normal"}>{message}</Text>
    </View>
  );
}
