import { useTheme } from "@tamagui/core";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button, HStack, StateContent, Text, VStack } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";
import { notify, reportError } from "~/components/feedback";
import {
  formatDownloadStatusText,
  getDownloadProgressRatio,
  summarizeDownloadManager,
} from "~/components/settings-format";
import { useDownloadList } from "~/features/cache";
import type { DownloadItem } from "~/features/cache";

export default function DownloadScreen() {
  const { downloadList, cancel, cancelAll } = useDownloadList();
  const [cancelling, setCancelling] = useState(false);

  const builtList: DownloadItem[] = Array.from(downloadList.values()).sort((a, b) => a.startTime - b.startTime);

  async function handleCancelAll() {
    setCancelling(true);
    try {
      await cancelAll();
      notify("已取消当前进行的所有下载任务");
    } catch (cause) {
      reportError(cause);
    } finally {
      setCancelling(false);
    }
  }

  function handleCancel(item: DownloadItem) {
    cancel(`${item.id}_${item.episode}`);
    notify(`已取消下载：${item.title}`);
  }

  return (
    <AppLayout back title="下载管理">
      <HStack alignItems="center" gap="$2" paddingBottom="$3" paddingHorizontal="$4">
        <Text color="$textMuted" flex={1} numberOfLines={1} size="sm">
          {summarizeDownloadManager(builtList)}
        </Text>
        <Button
          aria-label="取消全部下载任务"
          color="negative"
          disabled={cancelling || builtList.length <= 0}
          icon="fa6-solid:circle-stop"
          size="sm"
          variant="outline"
          onPress={() => void handleCancelAll()}
        >
          取消全部
        </Button>
      </HStack>
      {builtList.length > 0 ? (
        <VStack>
          {builtList.map(item => (
            <DownloadEntry key={`${item.id}_${item.episode}`} item={item} onCancel={() => handleCancel(item)} />
          ))}
        </VStack>
      ) : (
        <StateContent description="缓存的曲目会自动下载，也可以在曲目菜单里手动开始" title="无下载任务" />
      )}
    </AppLayout>
  );
}

function DownloadEntry({ item, onCancel }: { item: DownloadItem; onCancel: () => void }) {
  const theme = useTheme();
  const statusText = formatDownloadStatusText(item);
  const failed = item.status === 3;

  return (
    <HStack alignItems="center" gap="$3" paddingHorizontal="$4">
      <VStack flex={1} gap="$2" height={64} justifyContent="center" minWidth={0}>
        <HStack alignItems="center" gap="$4">
          <Text flex={1} numberOfLines={1} size="sm">
            {item.title}
          </Text>
          <Text color={failed ? "$danger" : "$textMuted"} size="sm">
            {statusText}
          </Text>
        </HStack>
        <View style={[styles.track, { backgroundColor: theme.sliderTrack.get() }]}>
          {item.status !== 0 ? (
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: theme.sliderRange.get(),
                  width: `${getDownloadProgressRatio(item.progress) * 100}%`,
                },
              ]}
            />
          ) : null}
        </View>
      </VStack>
      <Button
        aria-label={`取消下载 ${item.title}`}
        color="neutral"
        icon="fa6-solid:xmark"
        shape="rounded"
        size="sm"
        variant="ghost"
        onPress={onCancel}
      />
    </HStack>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    width: "100%",
  },
  fill: {
    height: "100%",
  },
});
