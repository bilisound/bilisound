import { ScrollView, View } from "react-native";
import { Text } from "~/components/ui/text";
import { useLocalSearchParams } from "expo-router";
import { getVideoMetadata } from "~/features/bilibili";
import { useQuery } from "@tanstack/react-query";
import { useWindowSize } from "~/hooks/useWindowSize";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { height } = useWindowSize();

  // 数据请求
  const { data } = useQuery({
    queryKey: [id],
    queryFn: () => {
      if (!id) {
        return undefined;
      }
      return getVideoMetadata(id);
    },
  });

  return (
    <View className={"bg-background-0"} style={{ maxHeight: height * 0.75 }}>
      <ScrollView
        style={{
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
      >
        <Text className={"text-sm leading-normal p-4"}>{data?.description}</Text>
      </ScrollView>
    </View>
  );
}
