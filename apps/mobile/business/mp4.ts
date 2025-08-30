import { File } from "expo-file-system/next";
import { Mp4 } from "mp4.js/dist";
import log from "~/utils/logger";

export function extractAudioFile(input: File, output: File) {
  log.debug("提取操作开始");

  const from = new Date().getTime();

  const stream = input.bytes();
  const m4aBytes = Mp4.extractAudio(stream);

  output.write(m4aBytes);

  log.debug(`提取操作结束，操作用时 ${(new Date().getTime() - from) / 1000}s`);
}
