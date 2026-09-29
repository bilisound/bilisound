import { Button } from "@bilisound/ui";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

import { BRAND } from "~/constants/branding";
import { addDownloadTask, isCacheExists, pickDownloadTask } from "~/features/cache";
import { useWindowSize } from "~/hooks/useWindowSize";

export interface DownloadButtonProps {
  items: { id: string; episode: number; title: string }[];
}

/**
 * 批量下载按钮，由 v2 `apps/mobile/components/download-button.tsx` 搬运。
 *
 * 行为保持一致：跳过已有缓存的曲目、逐首加入下载队列并立刻触发调度，
 * 每个任务提示一次「下载任务已添加」；Web 端没有下载能力，与 v2 相同不渲染。
 */
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
        for (const item of items) {
          if (!isCacheExists(item.id, item.episode)) {
            addDownloadTask(item.id, item.episode, item.title);
          }
          pickDownloadTask();
          Toast.show({
            type: "success",
            text1: "下载任务已添加",
            text2: `让 ${BRAND} 一直播放音乐，可以加快下载速度`,
          });
        }
      }}
    >
      {showFullText ? "下载" : null}
    </Button>
  );
}
