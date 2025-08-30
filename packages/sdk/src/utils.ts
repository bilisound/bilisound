import { WebPlayInfo } from "@/types-vendor";

export function filterHostname(list: string[]) {
  return list.map(e => {
    try {
      const { hostname } = new URL(e);
      return hostname;
    } catch (er) {
      // 日志用的工具函数，错误在这里不重要
      return e;
    }
  });
}

export interface ExtractJSONOptions {
  parsePrefix?: string;
  parseSuffix?: string;
  index?: number;
}

export function extractJSON<T = any>(regex: RegExp, str: string, options: ExtractJSONOptions = {}): T {
  const parsePrefix = options.parsePrefix ?? "";
  const parseSuffix = options.parseSuffix ?? "";
  const index = options.index ?? 1;
  const extracted = regex.exec(str);
  if (!extracted || !extracted[index]) {
    throw new Error("视频已经被删除或不存在（解析视频页面失败）");
  }
  return JSON.parse(parsePrefix + extracted[index] + parseSuffix);
}

export function convertToHTTPS(url: string) {
  return url.replace(/^http:\/\//, "https://");
}

export function findBestAudio(dashAudio: WebPlayInfo["data"]["dash"]["audio"]) {
  let maxQualityIndex = 0;

  let maxId = dashAudio[0]?.id ?? 0;
  dashAudio.forEach((audio, index) => {
    if (audio.id > maxId) {
      maxId = audio.id;
      maxQualityIndex = index;
    }
  });

  return maxQualityIndex;
}
