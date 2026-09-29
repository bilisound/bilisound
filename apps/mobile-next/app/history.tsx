import { useEffect, useState } from "react";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Button, Text, VStack } from "@bilisound/ui";

import { AppLayout } from "~/components/app-layout";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { DiscoveryVideoItem } from "~/components/discovery-video-item";
import { notify } from "~/components/feedback";
import { getVideoImageUrl, getVideoUrl } from "~/features/bilibili";
import { usePlaybackHistory } from "~/features/playback";

/**
 * 历史记录页：展示访问过的视频，支持清空（搬运 v2 `history.tsx`）。
 */
export default function HistoryScreen() {
  const { historyList, clearHistoryList, repairHistoryList } = usePlaybackHistory();
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    repairHistoryList();
  }, [repairHistoryList]);

  const goToQuery = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  };

  return (
    <AppLayout
      actions={
        historyList.length > 0 ? (
          <Button
            aria-label="清空历史记录"
            icon="fa6-solid:trash-can"
            onPress={() => setConfirmVisible(true)}
            shape="rounded"
            size="lg"
            variant="ghost"
          />
        ) : undefined
      }
      back
      scroll={false}
      title="历史记录"
    >
      {historyList.length > 0 ? (
        <FlashList
          data={historyList}
          keyExtractor={item => item.key ?? String(item.id)}
          renderItem={({ item }) => (
            <DiscoveryVideoItem
              image={getVideoImageUrl(item.thumbnailUrl, getVideoUrl(item.id))}
              onPress={() => router.navigate(`/video/${item.id}`)}
              subtitle={item.authorName}
              title={item.name}
            />
          )}
        />
      ) : (
        <VStack alignItems="center" flex={1} gap="$4" justifyContent="center">
          <Text color="$textMuted" semiBold size="sm">
            这里空空如也
          </Text>
          <Button onPress={goToQuery} shape="rounded">
            去查询
          </Button>
        </VStack>
      )}
      <ConfirmDialog
        description="确定要清空历史记录吗？"
        onClose={confirmed => {
          setConfirmVisible(false);
          if (confirmed) {
            clearHistoryList();
            notify("已清空历史记录");
          }
        }}
        open={confirmVisible}
        title="操作确认"
      />
    </AppLayout>
  );
}
