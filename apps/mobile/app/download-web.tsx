import { Layout } from "~/components/layout";
import { Text } from "~/components/ui/text";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getDownloadUrl, getVideoImageUrl, getVideoMetadata } from "~/features/bilibili";
import { ActionSheetCurrent } from "~/components/action-sheet-current";
import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";

export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // 数据请求
  const { data } = useQuery({
    queryKey: [id],
    queryFn: () => {
      return getVideoMetadata(id);
    },
  });

  return (
    <Layout leftAccessories={"BACK_BUTTON"} title={"下载音频"}>
      {data ? (
        <>
          <View className={"flex-0 basis-auto gap-2 pb-2"}>
            <ActionSheetCurrent line1={data.title} line2={data.owner.name} image={getVideoImageUrl(data.coverUrl)} />
            <Text className={"text-sm font-semibold color-typography-500"}>
              本视频含有多个分集，请直接点击您要下载的分集，或右键点击「另存为」下载音频：
            </Text>
          </View>
          <FlashList
            renderItem={({ item }) => (
              <a
                className={"flex flex-row items-center gap-3 px-3 h-12 hover:bg-background-50"}
                href={getDownloadUrl(data.bvid, item.page)}
                target={"_blank"}
              >
                <div
                  className={
                    "flex flex-0 basis-auto items-center justify-center px-1.5 h-[1.375rem] rounded-md bg-accent-500 color-white text-sm tabular-nums"
                  }
                  style={{ fontFamily: "Roboto_400Regular" }}
                >
                  {item.page}
                </div>
                <div className={"flex-1 truncate text-sm"}>{item.title}</div>
              </a>
            )}
            data={data.episodes}
          ></FlashList>
        </>
      ) : null}
    </Layout>
  );
}
