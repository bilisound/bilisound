import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";

import { Button, StateContent } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";
import { reportError } from "~/components/feedback";
import { SettingsLogViewer } from "~/components/settings-log-viewer";
import { getLog, shareLog } from "~/utils/logger";

export default function LogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const native = Platform.OS !== "web";
  const { data, error, refetch } = useQuery({
    enabled: Boolean(id),
    queryFn: () => getLog(id),
    queryKey: ["log", id],
  });

  return (
    <AppLayout
      back
      actions={
        native ? (
          <Button
            aria-label="分享日志"
            color="neutral"
            icon="fa6-solid:share"
            shape="rounded"
            size="lg"
            variant="ghost"
            onPress={() => void shareLog(id).catch(reportError)}
          />
        ) : undefined
      }
      scroll={false}
      title="查看日志详情"
    >
      {error ? (
        <StateContent
          description={error instanceof Error ? error.message : String(error)}
          title="无法读取日志"
          onRetry={() => void refetch()}
        />
      ) : data ? (
        <SettingsLogViewer text={data} />
      ) : (
        <StateContent loading title="正在读取日志" />
      )}
    </AppLayout>
  );
}
