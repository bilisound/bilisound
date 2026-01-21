import promiseMemoize from "promise-memoize";

import { biliRequest } from "~/api/external/request";
import {
  UserInfo,
  UserSeasonInfo,
  UserSeriesInfo,
  UserSeriesMetadata,
  WebPlayInfo,
} from "~/api/external/types";
import { Numberish } from "~/typings/common";

const maxAge = 600_000;

export const getVideoUrlFestival = promiseMemoize(
  (referer: string, avid: Numberish, bvid: string, cid: Numberish) => {
    return biliRequest<WebPlayInfo>({
      url: "/x/player/wbi/playurl",
      params: {
        avid,
        bvid,
        cid,
      },
      headers: {
        referer,
      },
    });
  },
  { maxAge },
);

export const getUserSeason = promiseMemoize(
  (userId: Numberish, seasonId: Numberish, pageNum = 1) => {
    return biliRequest<UserSeasonInfo>({
      url: "/x/polymer/web-space/seasons_archives_list",
      params: {
        mid: userId,
        season_id: seasonId,
        sort_reverse: false,
        page_num: pageNum,
        page_size: 30,
      },
      headers: {
        referer: `https://space.bilibili.com/${userId}/channel/collectiondetail?sid=${seasonId}`,
      },
    });
  },
  { maxAge },
);

export const getUserSeries = promiseMemoize(
  (userId: Numberish, seriesId: Numberish, pageNum = 1) => {
    return biliRequest<UserSeriesInfo>({
      url: "/x/series/archives",
      params: {
        mid: userId,
        series_id: seriesId,
        only_normal: true,
        sort: "desc",
        pn: pageNum,
        ps: 30,
      },
      headers: {
        referer: `https://space.bilibili.com/${userId}/channel/seriesdetail?sid=${seriesId}&ctype=0`,
      },
    });
  },
  { maxAge },
);

export const getUserSeriesMeta = promiseMemoize((seriesId: Numberish) => {
  return biliRequest<UserSeriesMetadata>({
    url: "/x/series/series",
    params: {
      series_id: seriesId,
    },
    disableWbi: true,
  });
});

export const getUserInfo = promiseMemoize(
  (userId: Numberish) => {
    return biliRequest<UserInfo>({
      url: "/x/space/wbi/acc/info",
      params: {
        mid: userId,
      },
      headers: {
        referer: `https://space.bilibili.com/${userId}/video`,
      },
    });
  },
  { maxAge },
);
