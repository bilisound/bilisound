import md5 from "md5";

export interface WbiKey {
  img_key: string;
  sub_key: string;
}

class WbiCache {
  static instance: WbiCache | null = null;

  lastAccess = 0;
  lastResult: WbiKey | null = null;

  static getInstance() {
    if (!WbiCache.instance) {
      WbiCache.instance = new WbiCache();
    }
    return WbiCache.instance;
  }
}

// https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md
const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41,
  13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34,
  44, 52,
];

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig: string) =>
  mixinKeyEncTab
    .map(n => orig[n])
    .join("")
    .slice(0, 32);

// 为请求参数进行 wbi 签名
export function encWbi(params: Record<string, string | number | object | boolean>, img_key: string, sub_key: string) {
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g;

  Object.assign(params, { wts: curr_time }); // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object.keys(params)
    .sort()
    .map(key => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, "");
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join("&");

  const wbi_sign = md5(query + mixin_key); // 计算 w_rid

  return `${query}&w_rid=${wbi_sign}`;
}
// 获取最新的 img_key 和 sub_key
export async function getWbiKeys(SESSDATA: string | undefined, sitePrefix: string, userAgent: string, token: string) {
  const cache = WbiCache.getInstance();
  if (cache.lastResult && new Date().getTime() - cache.lastAccess < 2 * 3600 * 1000) {
    return cache.lastResult;
  }
  const headers: HeadersInit = {
    "User-Agent": userAgent,
    Referer: "https://www.bilibili.com/", // 对于直接浏览器调用可能不适用
  };
  if (SESSDATA) {
    headers.Cookie = `SESSDATA=${SESSDATA}`;
  }
  if (token) {
    headers["Bilisound-Token"] = token;
  }
  const res = await fetch(sitePrefix + "/x/web-interface/nav", {
    headers,
  });
  const {
    data: {
      wbi_img: { img_url, sub_url },
    },
  } = (await res.json()) as {
    data: {
      wbi_img: { img_url: string; sub_url: string };
    };
  };

  const result = {
    img_key: img_url.slice(img_url.lastIndexOf("/") + 1, img_url.lastIndexOf(".")),
    sub_key: sub_url.slice(sub_url.lastIndexOf("/") + 1, sub_url.lastIndexOf(".")),
  };
  cache.lastResult = result;
  cache.lastAccess = new Date().getTime();
  return result;
}

export async function signParam(
  params: Record<string, string | number | object | boolean>,
  sitePrefix: string,
  userAgent: string,
  token: string,
) {
  const { img_key, sub_key } = await getWbiKeys(undefined, sitePrefix, userAgent, token);
  return encWbi(params, img_key, sub_key);
}
