export interface ExtractJSONOptions {
  parsePrefix?: string;
  parseSuffix?: string;
  index?: number;
}

export function extractJSON<T = any>(
  regex: RegExp,
  str: string,
  options: ExtractJSONOptions = {},
): T {
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
