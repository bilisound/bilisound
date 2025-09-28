import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { isCacheExists } from "~/storage/cache-status";
import { addDownloadTask, pickDownloadTask } from "~/business/download";
import Toast from "react-native-toast-message";
import React, { memo } from "react";
import { BRAND } from "~/constants/branding";
import { useWindowSize } from "~/hooks/useWindowSize";
import { Platform } from "react-native";

export interface DownloadButtonProps {
  items: { id: string; episode: number; title: string }[];
}

function DownloadButtonRaw({ items }: DownloadButtonProps) {
  const { width } = useWindowSize();
  const showFullText = width >= 768;

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <ButtonOuter className={"rounded-full"}>
      <Button
        icon={!showFullText}
        aria-label={"下载"}
        className={"rounded-full"}
        onPress={() => {
          for (let i = 0; i < items.length; i++) {
            const e = items[i];
            if (!isCacheExists(e.id, e.episode)) {
              addDownloadTask(e.id, e.episode, e.title);
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
        <ButtonMonIcon name={"fa6-solid:download"} size={16} />
        {showFullText ? <ButtonText>下载</ButtonText> : null}
      </Button>
    </ButtonOuter>
  );
}

export const DownloadButton = memo(DownloadButtonRaw);
