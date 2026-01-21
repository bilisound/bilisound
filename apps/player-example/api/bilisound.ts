import { Platform } from "react-native";

import { Wrap } from "./common";
import { getVideo } from "./external/direct";

import {
  getUserSeason,
  getUserSeries,
  getUserSeriesMeta,
} from "~/api/external/json";
import {
  BILIBILI_GOOD_CDN_REGEX,
  BILIBILI_VIDEO_URL_PREFIX,
  BILISOUND_API_PREFIX,
  USER_AGENT_BILIBILI,
} from "~/constants/network";
import { Numberish } from "~/typings/common";
import log from "~/utils/logger";

export type GetBilisoundMetadataResponse = {
  bvid: string;
  aid: number;
  title: string;
  pic: string;
  pubDate: number;
  desc: string;
  owner: {
    mid: number;
    name: string;
    face: string;
  };
  pages: {
    page: number;
    part: string;
    duration: number;
  }[];
  seasonId?: number;
};

function filterHostname(list: string[]) {
  return list.map((e) => {
    try {
      const { hostname } = new URL(e);
      return hostname;
    } catch (er) {
      // 日志用的工具函数，错误在这里不重要
      log.warn("URL 解析失败：" + er);
      return e;
    }
  });
}

/**
 * 解析短链接
 */
export async function parseB23(id: string) {
  if (Platform.OS === "web") {
    const response = await fetch(
      BILISOUND_API_PREFIX + `/internal/resolve-b23?id=${id}`,
    );
    const json = await response.json();
    return json.data;
  }

  // 注意：直接指定 fetch 的重定向模式为 manual 的方案在 React Native 不可用
  // 详见 https://reactnative.dev/docs/network#known-issues-with-fetch-and-cookie-based-authentication
  const res = await fetch(`https://b23.tv/${id}`, {
    headers: {
      "User-Agent": USER_AGENT_BILIBILI,
    },
  });
  return res.url;
}

/**
 * 获取视频元数据
 * @param data
 */
export async function getBilisoundMetadata(data: {
  id: string;
}): Promise<Wrap<GetBilisoundMetadataResponse>> {
  if (Platform.OS === "web") {
    const response = await fetch(
      BILISOUND_API_PREFIX + `/internal/metadata?id=${data.id}`,
    );
    return response.json();
  }

  const { id } = data;
  // 获取视频网页
  const { initialState, type } = await getVideo({ id, episode: 1 });

  // 提取视频信息
  switch (type) {
    case "regular": {
      const videoData = initialState?.videoData;
      const pages = videoData?.pages ?? [];
      if (!videoData || pages.length <= 0) {
        log.error("找不到视频信息（在常规页面没有视频信息）");
        throw new Error("找不到视频信息");
      }
      if (videoData.is_upower_exclusive) {
        log.error("不支持的视频类型：充电视频");
        throw new Error("不支持的视频类型");
      }

      // 没有分 P 的视频，将第一个视频的标题替换成投稿标题
      if (pages.length === 1) {
        pages[0].part = videoData.title;
      }

      return {
        code: 200,
        data: {
          bvid: videoData.bvid,
          aid: videoData.aid,
          title: videoData.title,
          pic: videoData.pic,
          owner: videoData.owner,
          desc: (videoData?.desc_v2 ?? []).map((e) => e.raw_text).join("\n"),
          pubDate: videoData.pubdate * 1000,
          pages: pages.map(({ page, part, duration }) => ({
            page,
            part,
            duration,
          })),
          seasonId: videoData.season_id,
        },
        msg: "",
      };
    }
    case "festival": {
      const videoInfo = initialState?.videoInfo;
      const pages = videoInfo?.pages ?? [];
      if (!videoInfo || pages.length <= 0) {
        log.error("找不到视频信息（在活动页面没有视频信息）");
        throw new Error("找不到视频信息");
      }
      // 没有分 P 的视频，将第一个视频的标题替换成投稿标题
      if (pages.length === 1) {
        pages[0].part = videoInfo.title;
      }
      const found = initialState.sectionEpisodes.find(
        (e) => e.bvid === videoInfo.bvid,
      );
      if (!found) {
        log.error("找不到视频信息（在活动页面的合集列表找不到当前播放的视频）");
        throw new Error("找不到视频信息");
      }
      return {
        code: 200,
        data: {
          bvid: videoInfo.bvid,
          aid: videoInfo.aid,
          title: videoInfo.title,
          pic: found.cover,
          owner: found.author,
          desc: videoInfo.desc,
          pubDate: videoInfo.pubdate * 1000,
          pages: pages.map(({ page, part, duration }) => ({
            page,
            part,
            duration,
          })),
        },
        msg: "",
      };
    }
    default:
      throw new Error("未实现的视频类型！！");
  }
}

/**
 * 获取音频资源 URL
 * @param data
 */
export async function getBilisoundResourceUrl(data: {
  id: string;
  episode: number | string;
  filterResourceURL?: boolean;
}): Promise<{ url: string; isAudio: boolean }> {
  if (Platform.OS === "web") {
    return {
      url: `https://bilisound.tuu.run/api/internal/resource?id=${data.id}&episode=${data.episode}`,
      isAudio: true,
    };
  }

  const { id, episode } = data;

  // 获取视频
  const { playInfo } = await getVideo({ id, episode });
  const dashAudio = playInfo?.data?.dash?.audio;
  const legacyVideo = playInfo?.data?.durl;

  // [dash] 遍历获取最佳音质视频
  if (Array.isArray(dashAudio) && dashAudio.length > 0) {
    let maxQualityIndex = 0;
    dashAudio.forEach((value, index, array) => {
      if (array[maxQualityIndex].codecid < maxQualityIndex) {
        maxQualityIndex = index;
      }
    });

    const { baseUrl, backupUrl } = dashAudio[maxQualityIndex];
    const urlList = [baseUrl];
    if (Array.isArray(backupUrl)) {
      urlList.push(...backupUrl);
    }

    if (!data.filterResourceURL) {
      log.debug(
        `没有进行过滤。来源域名列表: ${filterHostname(urlList).join(", ")}`,
      );
      return { url: urlList[0], isAudio: true };
    }

    const newUrlList = urlList.filter((e) => {
      for (let i = 0; i < BILIBILI_GOOD_CDN_REGEX.length; i++) {
        const f = BILIBILI_GOOD_CDN_REGEX[i];
        if (f.test(new URL(e).hostname)) {
          return true;
        }
      }
      return false;
    });
    if (newUrlList.length <= 0) {
      log.warn(
        `过滤失败，因此使用原始地址列表中的第一项。来源域名列表: ${filterHostname(newUrlList).join(", ")}`,
      );
      return { url: newUrlList[0], isAudio: true };
    }
    log.debug(
      `过滤成功！来源域名列表: ${filterHostname(newUrlList).join(", ")}`,
    );
    return { url: newUrlList[0], isAudio: true };
  }

  // [legacy/durl] 遍历获取最佳音质视频
  if (Array.isArray(legacyVideo) && legacyVideo.length > 0) {
    const videoItem = legacyVideo[0];
    const urlList = [videoItem.url, ...videoItem.backup_url];
    if (!data.filterResourceURL) {
      log.debug(
        `没有进行过滤。来源域名列表: ${filterHostname(urlList).join(", ")}`,
      );
      return { url: urlList[0], isAudio: false };
    }
    const newUrlList = urlList.filter((e) => {
      for (let i = 0; i < BILIBILI_GOOD_CDN_REGEX.length; i++) {
        const f = BILIBILI_GOOD_CDN_REGEX[i];
        if (f.test(new URL(e).hostname)) {
          return true;
        }
      }
      return false;
    });

    if (newUrlList.length <= 0) {
      log.warn(
        `过滤失败，因此使用原始地址列表中的第一项。来源域名列表: ${filterHostname(newUrlList).join(", ")}`,
      );
      return { url: newUrlList[0], isAudio: false };
    }
    log.debug(
      `过滤成功！来源域名列表: ${filterHostname(newUrlList).join(", ")}`,
    );
    return { url: newUrlList[0], isAudio: false };
  }

  throw new Error("找不到视频流资源");
}

export interface EpisodeItem {
  bvid: string;
  title: string;
  cover: string;
  duration: number;
}

export interface GetEpisodeUserResponse {
  pageSize: number;
  pageNum: number;
  total: number;
  rows: EpisodeItem[];
  meta: {
    name: string;
    description: string;
    cover: string;
    userId: Numberish;
    seasonId: Numberish;
  };
}

export type UserListMode = "season" | "series" | "favourite";

export async function getUserList(
  mode: UserListMode,
  userId: Numberish,
  listId: Numberish,
  page = 1,
) {
  if (Platform.OS === "web") {
    const res = await fetch(
      `${BILISOUND_API_PREFIX}/internal/user-list?mode=${mode}&userId=${userId}&listId=${listId}&page=${page}`,
    );
    return (await res.json()).data;
  }

  let response;
  let pageSize;
  let pageNum;
  let total;
  let name = "";
  let description = "";
  let cover = "";
  if (mode === "season") {
    response = await getUserSeason(userId, listId, page);
    const data = response.data;
    pageSize = data.page.page_size;
    pageNum = data.page.page_num;
    total = data.page.total;
    name = data.meta.name;
    description = data.meta.description;
    cover = data.meta.cover;
  } else {
    response = await getUserSeries(userId, listId, page);
    const meta = await getUserSeriesMeta(listId);
    pageSize = response.data.page.size;
    pageNum = response.data.page.num;
    total = response.data.page.total;
    name = meta.data.meta.name;
    description = meta.data.meta.description;
    cover = response.data.archives[0].pic;
  }
  const rows = response.data.archives.map((e) => ({
    bvid: e.bvid,
    title: e.title,
    cover: e.pic,
    duration: e.duration,
  }));
  return {
    pageSize,
    pageNum,
    total,
    rows,
    meta: {
      name,
      description,
      cover,
      userId,
      seasonId: listId,
    },
  };
}

export async function getUserListFull(
  mode: UserListMode,
  userId: Numberish,
  listId: Numberish,
  progressCallback?: (progress: number) => void,
): Promise<EpisodeItem[]> {
  progressCallback?.(0);
  const firstResponse = await getUserList(mode, userId, listId, 1);
  const totalPages = Math.ceil(firstResponse.total / firstResponse.pageSize);
  progressCallback?.(1 / totalPages);
  let results: EpisodeItem[] = firstResponse.rows;
  if (firstResponse.total <= firstResponse.pageSize) {
    return results;
  }
  for (let i = 1; i < totalPages; i++) {
    const newResults = (await getUserList(mode, userId, listId, i + 1)).rows;
    progressCallback?.((i + 1) / totalPages);
    results = results.concat(newResults);
  }
  return results;
}

/**
 * 获取视频的 Web 页面地址
 * @param id
 * @param episode
 */
export function getVideoUrl(id: string, episode: Numberish) {
  return `${BILIBILI_VIDEO_URL_PREFIX}${id}/?p=${episode}`;
}
