import { Button } from "@bilisound/ui";
import { Platform } from "react-native";
import { useWindowSize } from "~/hooks/useWindowSize";
import { cacheVideoEpisodesToLocal } from "./discovery-download";
import { notify, reportError } from "./feedback";

export interface DownloadButtonProps {
  items: { id: string; episode: number; title: string }[];
}

/** Shared playlist/video download entry; report actual enqueues, not every attempted item. */
export function DownloadButton({ items }: DownloadButtonProps) {
  const { width } = useWindowSize();
  const showFullText = width >= 768;

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <Button
      aria-label="下载"
      icon="fa6-solid:download"
      shape="rounded"
      onPress={() => {
        try {
          const { added, skipped } = cacheVideoEpisodesToLocal(items);
          notify(
            added === 0
              ? "所有曲目都已在本地或下载队列中"
              : skipped > 0
                ? `已添加 ${added} 个下载任务，${skipped} 个已存在`
                : `已添加 ${added} 个下载任务`,
          );
        } catch (error) {
          reportError(error);
        }
      }}
    >
      {showFullText ? "下载" : null}
    </Button>
  );
}
