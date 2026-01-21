import promiseMemoize from "promise-memoize";

import { getVideoUrlFestival } from "~/api/external/json";
import {
  InitialStateFestivalResponse,
  InitialStateResponse,
  WebPlayInfo,
} from "~/api/external/types";
import {
  BILIBILI_VIDEO_URL_PREFIX,
  USER_AGENT_BILIBILI,
} from "~/constants/network";
import log from "~/utils/logger";
import { extractJSON } from "~/utils/string";

const maxAge = 600_000;

export interface GetVideoResponse {
  type: "regular";
  initialState: InitialStateResponse;
  playInfo: WebPlayInfo;
}

export interface GetVideoFestivalResponse {
  type: "festival";
  initialState: InitialStateFestivalResponse;
  playInfo: WebPlayInfo;
}

export interface GetVideoOptions {
  id?: string;
  episode?: string | number;
  url?: string;
}

const fetchRaw = promiseMemoize(
  async (url: string) => {
    const res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT_BILIBILI,
      },
    });
    return { finalUrl: res.url, response: await res.text() };
  },
  { maxAge },
);

export const getVideo = async ({
  id,
  episode = 1,
}: GetVideoOptions): Promise<GetVideoResponse | GetVideoFestivalResponse> => {
  const { finalUrl, response } = await fetchRaw(
    `${BILIBILI_VIDEO_URL_PREFIX}${id}/?p=${episode}`,
  );

  log.debug(`最终跳转结果：${finalUrl}`);
  if (finalUrl.startsWith("https://www.bilibili.com/festival/")) {
    log.debug(`按照活动视频处理该查询`);
    // 提取视频播放信息
    const initialState: InitialStateFestivalResponse = extractJSON(
      /window\.__INITIAL_STATE__=(\{.+});\(function\(\)\{/,
      response,
    );
    // 提取视频流信息
    const playInfo = await getVideoUrlFestival(
      finalUrl,
      initialState.videoInfo.aid,
      initialState.videoInfo.bvid,
      initialState.videoInfo.pages[0].cid,
    );

    return { type: "festival", initialState, playInfo };
  } else {
    // 提取视频播放信息
    log.debug(`按照常规视频处理该查询`);
    const initialState: InitialStateResponse = extractJSON(
      /window\.__INITIAL_STATE__=(\{.+});\(function\(\){/,
      response,
    );
    let playInfo: WebPlayInfo;
    try {
      playInfo = extractJSON(
        /window\.__playinfo__=(\{.+})<\/script><script>window.__INITIAL_STATE__=/,
        response,
      );
    } catch (e) {
      log.debug(`匹配关键词失败：${e}`);
      log.debug("正在采用降级方案……");
      playInfo = await getVideoUrlFestival(
        finalUrl,
        initialState.videoData.aid,
        initialState.videoData.bvid,
        initialState.videoData.pages.find((e) => e.page === Number(episode))
          ?.cid ?? 0,
      );
    }
    return { type: "regular", initialState, playInfo };
  }
};
