// 定义可信任的 CDN 域名正则表达式
export const BILIBILI_GOOD_CDN_REGEX: readonly RegExp[] = [/^upos-[hs]z-[a-z|0-9]+\..+\.[a-z]+$/];

/**
 * 过滤 URL 列表，只保留可信任的 CDN 域名
 * @param urlList URL 列表
 * @returns 过滤后的 URL 列表
 */
export function filterCdnUrls(urlList: string[]): string[] {
  return urlList.filter(url => {
    try {
      const hostname = new URL(url).hostname;
      return BILIBILI_GOOD_CDN_REGEX.some(regex => regex.test(hostname));
    } catch {
      return false;
    }
  });
}
