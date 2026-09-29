import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import { Button, StateContent, Text, VStack } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { notify, reportError } from "~/components/feedback";
import { formatLogDisplayName } from "~/components/settings-format";
import { SettingsMenuItem } from "~/components/settings-menu";
import { deleteLogContent, getLogList } from "~/utils/logger";

export default function LogsScreen() {
  const { data, error, isLoading, refetch } = useQuery<string[]>({
    queryKey: ["log_list"],
    queryFn: getLogList,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteLogContent();
      await refetch();
      notify("历史日志清除成功");
    } catch (cause) {
      reportError(cause);
    }
  }

  const logs = data ?? [];

  return (
    <AppLayout
      back
      actions={
        <Button
          aria-label="删除日志"
          color="neutral"
          disabled={logs.length <= 0}
          icon="fa6-solid:trash-can"
          shape="rounded"
          size="lg"
          variant="ghost"
          onPress={() => setConfirmOpen(true)}
        />
      }
      scroll={false}
      title="查看日志"
    >
      <VStack flex={1}>
        {error ? (
          <StateContent
            description={error instanceof Error ? error.message : String(error)}
            title="无法读取日志"
            onRetry={() => void refetch()}
          />
        ) : logs.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.list}
            data={logs}
            keyExtractor={item => item}
            ListFooterComponent={
              <Text color="$textMuted" padding="$4" size="sm" textAlign="center">
                超过 14 天的日志会被自动删除
              </Text>
            }
            renderItem={({ item }) => (
              <SettingsMenuItem
                description={item}
                icon="fa6-solid:file-lines"
                title={formatLogDisplayName(item)}
                onPress={() => router.navigate(`/settings/log/${item}`)}
              />
            )}
          />
        ) : (
          <StateContent description="应用运行时会在这里生成日志文件" loading={isLoading} title="暂无日志" />
        )}
      </VStack>
      <ConfirmDialog
        description="确定要清除之前的历史日志吗？今日的日志不会被清除。"
        open={confirmOpen}
        title="清除历史日志确认"
        onClose={confirmed => {
          setConfirmOpen(false);
          if (confirmed) {
            void handleDelete();
          }
        }}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 16,
  },
});
