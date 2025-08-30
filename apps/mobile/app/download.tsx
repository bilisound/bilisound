import { Layout } from "~/components/layout";
import { Text } from "~/components/ui/text";
import useDownloadStore, { DownloadItem } from "~/store/download";
import { ActivityIndicator, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { filesize } from "filesize";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import Toast from "react-native-toast-message";
import React, { useState } from "react";
import log from "~/utils/logger";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";

interface DownloadEntryProps {
  item: DownloadItem;
}

function DownloadEntry({ item }: DownloadEntryProps) {
  return (
    <View className={"flex-row px-4 items-center"}>
      <View className={"h-[4rem] flex-1 gap-3 justify-center"}>
        <View className={"flex-row gap-4"}>
          <Text className={"text-sm flex-1"} isTruncated>
            {item.title}
          </Text>
          <Text className={`flex-0 basis-auto text-sm ${item.status === 3 ? "text-red-500" : "text-typography-500"}`}>
            {(() => {
              if (item.status === 0) {
                return "排队中";
              }
              if (item.status === 2) {
                return "本地处理中";
              }
              if (item.status === 3) {
                return "下载失败";
              }
              const bytesDiff = item.progress.totalBytesWritten - item.progressOld.totalBytesWritten;
              const timeDiff = (item.updateTime - item.updateTimeOld) / 1000;

              // Handle cases where timeDiff is 0 or negative
              const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

              return filesize(speed) + "/s";
            })()}
          </Text>
        </View>
        <View className={"w-full h-1 bg-secondary-100"}>
          {item.status !== 0 && (
            <View
              className={"h-full bg-secondary-300"}
              style={{
                width:
                  item.progress.totalBytesExpectedToWrite === 0
                    ? 0
                    : `${(item.progress.totalBytesWritten / item.progress.totalBytesExpectedToWrite) * 100}%`,
              }}
            ></View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function Page() {
  const { downloadList, cancelAll } = useDownloadStore();
  const { colorValue } = useRawThemeValues();

  const builtList: DownloadItem[] = Array.from(downloadList.values()).sort((a, b) => a.startTime - b.startTime);
  const displayList = builtList.filter(e => e.status === 1 || e.status === 3);
  const runningList = displayList.filter(e => e.status === 1);

  const [loading, setLoading] = useState(false);
  async function handleCancel() {
    setLoading(true);
    try {
      await cancelAll();
      Toast.show({
        type: "success",
        text1: "已取消当前进行的所有下载任务",
      });
    } catch (e) {
      log.error("下载任务取消失败：" + e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout leftAccessories={"BACK_BUTTON"} title={"下载管理"}>
      <View className={"flex flex-0 basis-auto flex-row items-center gap-2 p-4 pt-0"}>
        <View className={"flex-1"}>
          <Text className={"text-typography-500 text-sm"} isTruncated>
            {builtList.length <= 0 ? "无下载任务" : `当前有 ${runningList.length} / ${builtList.length} 个任务进行中`}
          </Text>
        </View>
        <ButtonOuter className={"flex-0 basis-auto rounded-full"}>
          <Button onPress={handleCancel} action={"negative"} disabled={loading || builtList.length <= 0}>
            {loading ? (
              <View className={"size-[18px] items-center justify-center"}>
                <ActivityIndicator className={"size-4"} color={colorValue("--color-typography-0")} />
              </View>
            ) : (
              <ButtonMonIcon name={"fa6-solid:circle-stop"} size={18} />
            )}
            <ButtonText>取消全部</ButtonText>
          </Button>
        </ButtonOuter>
      </View>
      <FlashList
        data={displayList}
        renderItem={e => <DownloadEntry item={e.item} />}
        ListFooterComponent={
          displayList.length > 0 ? (
            <View className={"flex-1 items-center py-4 gap-1"}>
              <Text
                className={"text-typography-500 text-sm"}
              >{`还有 ${builtList.length - displayList.length} 个任务排队中`}</Text>
              <Text className={"text-typography-500 text-sm"}>可点击上方「取消全部」停止下载</Text>
            </View>
          ) : null
        }
      />
    </Layout>
  );
}
