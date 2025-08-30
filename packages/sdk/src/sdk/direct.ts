import {
  GetEpisodeUserResponse,
  GetMetadataResponse,
  Logger,
  SDKOptions,
  GetVideoFestivalResponse,
  GetVideoResponse,
  UserListMode,
  EpisodeItem,
  GetResourceOptions,
  CacheProvider,
  GetResourceUrlResponse,
} from "../types";
import { filterCdnUrls } from "../cdn";
import { InitialStateFestivalResponse, InitialStateResponse, WebPlayInfo } from "../types-vendor";
import { extractJSON, findBestAudio } from "../utils";
import axiosClient from "axios";
import { signParam } from "../wbi";
import { BiliRequestConfig, InternalBiliRequestConfig } from "../request";
import { Numberish } from "../types";
import { UserSeasonInfo, UserSeriesInfo, UserSeriesMetadata } from "../types-vendor";
import { BilisoundSDK } from "./base";

export class BilisoundSDKDirect extends BilisoundSDK {
  logger: Logger;
  userAgent = "";
  sitePrefix = "";
  apiPrefix = "";
  key = "";
  request: <T>(cfg: BiliRequestConfig) => Promise<T>;
  cacheProvider: CacheProvider;

  constructor(options: SDKOptions = {}) {
    super();
    this.logger = options.logger ?? {
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
    this.userAgent = options.userAgent;
    this.sitePrefix = options.sitePrefix;
    this.apiPrefix = options.apiPrefix;
    this.key = options.key;
    this.cacheProvider = options.cacheProvider ?? {
      async get() {
        return null;
      },
      async set() {},
      async delete() {},
    };
    this.initRequest();
  }

  private initRequest() {
    const instance = axiosClient.create({
      baseURL: this.apiPrefix,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": this.userAgent,
      },
    });

    instance.interceptors.request.use(
      async (req: InternalBiliRequestConfig) => {
        if (this.key) {
          req.headers.set("Bilisound-Token", this.key);
        }
        if (!req.disableWbi) {
          const params = req.params || {};
          const encodedParams = await signParam(params, this.apiPrefix, this.userAgent, this.key);
          req.url = `${req.url}?${encodedParams}`;
          delete req.params;
        }
        this.logger.debug(`发起请求：${req.url}`);
        return req;
      },
      error => {
        return Promise.reject(error);
      },
    );

    /**
     * Handle all responses. It is possible to add handlers
     * for requests, but it is omitted here for brevity.
     */
    instance.interceptors.response.use(
      res => {
        if (res.data.code !== 0) {
          this.logger.error(`发生业务错误：${res.data.code}，详情信息：${res.data.message}`);
          throw new Error(res.data.message);
        }
        return res.data;
      },
      err => {
        return Promise.reject(err);
      },
    );

    this.request = <T>(cfg: BiliRequestConfig) => instance.request<any, T>(cfg);
  }

  async parseB23(id: string): Promise<string> {
    const res = await fetch(`https://b23.tv/${id}`, {
      headers: {
        "User-Agent": this.userAgent,
      },
    });
    return res.url;
  }

  async getMetadata(id: string): Promise<GetMetadataResponse> {
    // 获取视频网页
    const videoData = await this.getVideo(id, 1);
    return this.parseVideoData(videoData);
  }

  async getResourceUrl(
    id: string,
    episode: number | string,
    filterResourceURL = false,
  ): Promise<GetResourceUrlResponse> {
    // 获取视频
    const { playInfo } = await this.getVideo(id, episode);
    const dashAudio = playInfo.data?.dash?.audio;
    const legacyVideo = playInfo.data?.durl;

    // [dash] 遍历获取最佳音质视频
    if (Array.isArray(dashAudio) && dashAudio.length > 0) {
      let maxQualityIndex = findBestAudio(dashAudio);

      const { baseUrl, backupUrl } = dashAudio[maxQualityIndex];
      const urlList = [baseUrl];
      if (Array.isArray(backupUrl)) {
        urlList.push(...backupUrl);
      }

      if (!filterResourceURL) {
        this.logger.info(`没有进行过滤。来源域名列表: ${this.filterHostname(urlList).join(", ")}`);
        return { url: urlList[0], volume: playInfo.data.volume, isAudio: true };
      }

      const newUrlList = filterCdnUrls(urlList);
      if (newUrlList.length <= 0) {
        this.logger.warn(
          `过滤失败，因此使用原始地址列表中的第一项。来源域名列表: ${this.filterHostname(urlList).join(", ")}`,
        );
        return { url: urlList[0], volume: playInfo.data.volume, isAudio: true };
      }
      this.logger.info(`过滤成功！来源域名列表: ${this.filterHostname(newUrlList).join(", ")}`);
      return { url: newUrlList[0], volume: playInfo.data.volume, isAudio: true };
    }

    // [legacy] 尝试获取传统方式的视频
    if (Array.isArray(legacyVideo) && legacyVideo.length > 0) {
      if (!filterResourceURL) {
        this.logger.info(`没有进行过滤。来源域名列表: ${this.filterHostname(legacyVideo.map(e => e.url)).join(", ")}`);
        return { url: legacyVideo[0].url, volume: playInfo.data.volume, isAudio: false };
      }

      const newUrlList = filterCdnUrls(legacyVideo.map(e => e.url));
      if (newUrlList.length <= 0) {
        this.logger.warn(
          `过滤失败，因此使用原始地址列表中的第一项。来源域名列表: ${this.filterHostname(legacyVideo.map(e => e.url)).join(", ")}`,
        );
        return { url: legacyVideo[0].url, volume: playInfo.data.volume, isAudio: false };
      }
      this.logger.info(`过滤成功！来源域名列表: ${this.filterHostname(newUrlList).join(", ")}`);
      return { url: newUrlList[0], volume: playInfo.data.volume, isAudio: false };
    }

    throw new Error("找不到可用的音频资源");
  }

  async getUserList(
    mode: UserListMode,
    userId: Numberish,
    listId: Numberish,
    page = 1,
  ): Promise<GetEpisodeUserResponse> {
    let response;
    let pageSize;
    let pageNum;
    let total;
    let name = "";
    let description = "";
    let cover = "";
    switch (mode) {
      case "season": // 首先尝试从任意一个视频详情页面抓取完整的合集列表
        const fullResult = await this.tryGetFullSection(userId, listId);
        if (fullResult) {
          return fullResult;
        }

        response = await this.getUserSeason(userId, listId, page);
        const data = response.data;
        pageSize = data.page.page_size;
        pageNum = data.page.page_num;
        total = data.page.total;
        name = data.meta.name;
        description = data.meta.description;
        cover = data.meta.cover;
        break;
      case "series":
        response = await this.getUserSeries(userId, listId, page);
        const meta = await this.getUserSeriesMeta(listId);
        pageSize = response.data.page.size;
        pageNum = response.data.page.num;
        total = response.data.page.total;
        name = meta.data.meta.name;
        description = meta.data.meta.description;
        cover = response.data.archives[0].pic;
        break;
    }
    const rows = response.data.archives.map(e => ({
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

  async getUserListFull(
    mode: UserListMode,
    userId: Numberish,
    listId: Numberish,
    progressCallback?: (progress: number) => void,
  ): Promise<EpisodeItem[]> {
    progressCallback?.(0);
    const firstResponse = await this.getUserList(mode, userId, listId, 1);
    const totalPages = Math.ceil(firstResponse.total / firstResponse.pageSize);
    progressCallback?.(1 / totalPages);
    let results: EpisodeItem[] = firstResponse.rows;
    if (firstResponse.total <= firstResponse.pageSize) {
      return results;
    }
    for (let i = 1; i < totalPages; i++) {
      const newResults = (await this.getUserList(mode, userId, listId, i + 1)).rows;
      progressCallback?.((i + 1) / totalPages);
      results = results.concat(newResults);
    }
    return results;
  }

  async getResource(id: string, episode: number | string, options: GetResourceOptions = {}) {
    // 获取视频
    const { playInfo, initialState, type } = await this.getVideo(id, episode);
    const dashAudio = playInfo?.data?.dash?.audio ?? [];

    if (dashAudio.length < 1) {
      throw new Error("找不到视频资源");
    }

    // 遍历获取最佳音质视频
    const maxQualityIndex = findBestAudio(dashAudio);

    // 将音频字节流进行转发
    const headers = {
      "User-Agent": this.userAgent,
      Referer: `https://www.bilibili.com/video/` + id + "/?p=" + episode,
      Range: options.range || "bytes=0-",
    };
    const res = await fetch(dashAudio[maxQualityIndex].baseUrl, {
      headers,
      method: options.method || "get",
    });

    let episodeName = "";
    let aid = 0;
    let bvid = "";
    if (type === "regular") {
      episodeName = initialState.videoData.title;
      if (initialState.videoData.pages.length > 1) {
        episodeName = initialState.videoData.pages.find(e => e.page === episode)?.part;
      }
      aid = initialState.aid;
      bvid = initialState.bvid;
    }
    if (type === "festival") {
      episodeName = initialState.videoInfo.title;
      aid = initialState.videoInfo.aid;
      bvid = initialState.videoInfo.bvid;
    }
    const data = await res.arrayBuffer();
    const contentRange = res.headers.get("Content-Range");
    const contentLength = res.headers.get("Content-Length");

    return { aid, bvid, episodeName, data, contentRange, contentLength };
  }

  // 工具部分

  private async fetchRaw(url: string) {
    const headers = {
      "user-agent": this.userAgent,
    };
    if (this.key) {
      headers["Bilisound-Token"] = this.key;
    }
    const res = await fetch(url, {
      headers,
    });
    return { finalUrl: res.url, response: await res.text() };
  }

  private filterHostname(list: string[]): string[] {
    return list.map(e => {
      try {
        const { hostname } = new URL(e);
        return hostname;
      } catch (er) {
        this.logger.warn("URL 解析失败：" + er);
        return e;
      }
    });
  }

  private parseVideoData(videoData: GetVideoResponse | GetVideoFestivalResponse): GetMetadataResponse {
    const { initialState, type } = videoData;

    switch (type) {
      case "regular": {
        const data = initialState.videoData;
        const pages = data?.pages ?? [];
        if (!data || pages.length <= 0) {
          this.logger.error("找不到视频信息（在常规页面没有视频信息）");
          throw new Error("找不到视频信息");
        }
        if (data.is_upower_exclusive) {
          this.logger.error("不支持的视频类型：充电视频");
          throw new Error("不支持的视频类型");
        }

        // 没有分 P 的视频，将第一个视频的标题替换成投稿标题
        if (pages.length === 1 && pages[0].part.trim().length <= 0) {
          pages[0].part = data.title;
        }

        const built: GetMetadataResponse = {
          bvid: data.bvid,
          aid: data.aid,
          title: data.title,
          pic: data.pic,
          owner: data.owner,
          desc: (data.desc_v2 ?? []).map(e => e.raw_text).join("\n"),
          pubDate: data.pubdate * 1000,
          pages: pages.map(({ page, part, duration }, _, arr) => {
            return { page, part: arr.length === 1 ? data.title : part, duration, partDisplayName: part };
          }),
          seasonId: data.season_id,
        };
        if (data.staff) {
          built.staff = data.staff.map(e => ({
            mid: e.mid,
            name: e.name,
            face: e.face,
            title: e.title,
          }));
        }
        return built;
      }
      case "festival": {
        const videoInfo = initialState.videoInfo;
        const pages = videoInfo?.pages ?? [];
        if (!videoInfo || pages.length <= 0) {
          this.logger.error("找不到视频信息（在活动页面没有视频信息）");
          throw new Error("找不到视频信息");
        }
        // 没有分 P 的视频，将第一个视频的标题替换成投稿标题
        if (pages.length === 1) {
          pages[0].part = videoInfo.title;
        }
        const found = initialState.sectionEpisodes?.find(e => e.bvid === videoInfo.bvid);
        if (!found) {
          this.logger.error("找不到视频信息（在活动页面的合集列表找不到当前播放的视频）");
          throw new Error("找不到视频信息");
        }
        return {
          bvid: videoInfo.bvid,
          aid: videoInfo.aid,
          title: videoInfo.title,
          pic: found.cover,
          owner: found.author,
          desc: videoInfo.desc,
          pubDate: videoInfo.pubdate * 1000,
          pages: pages.map(({ page, part, duration }, _, arr) => {
            return {
              page,
              part: arr.length === 1 ? videoInfo.title : part,
              duration,
              partDisplayName: part,
            };
          }),
        };
      }
      default:
        throw new Error("未实现的视频类型！！");
    }
  }

  private async tryGetFullSection(userId: Numberish, listId: Numberish): Promise<GetEpisodeUserResponse | null> {
    this.logger.info("尝试一次获取完整合集");
    this.logger.debug(`userId: ${userId}, listId: ${listId}`);

    const { data } = await this.getUserSeason(userId, listId, 1);
    if (data.page.total <= data.page.page_size) {
      this.logger.warn("一次获取完整合集取消：视频总数小于单页展示数量，无需进行此操作");
      return null;
    }

    const name = data.meta.name;
    const description = data.meta.description;
    const cover = data.meta.cover;
    const firstVideoId = data.archives[0]?.bvid;
    if (!firstVideoId) {
      this.logger.warn("一次获取完整合集失败：列表中没有找到第一个视频 ID");
      return null;
    }

    const firstVideoResponse = await this.getVideo(firstVideoId, 1);
    if (firstVideoResponse.type !== "regular") {
      this.logger.warn("一次获取完整合集失败：非常规视频");
      return null;
    }

    const sections = firstVideoResponse.initialState.sectionsInfo?.sections ?? [];
    const episodes = sections.flatMap(section => section.episodes ?? []);
    if (episodes.length <= 0) {
      this.logger.warn("一次获取完整合集失败：列表中没有找到视频");
      return null;
    }

    const rows = episodes.map(e => ({
      bvid: e.bvid,
      title: e.title,
      cover: e.arc.pic,
      duration: e.arc.duration,
    }));

    this.logger.debug(`一次获取完整合集成功：${rows.length} 条记录`);
    return {
      pageSize: rows.length,
      pageNum: 1,
      total: rows.length,
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

  // JSON 请求部分

  private async getVideo(id: string, episode: number | string): Promise<GetVideoResponse | GetVideoFestivalResponse> {
    const cacheKey = `bilisound_getVideo_${id}_${episode}`;
    const cacheGot = await this.cacheProvider.get(cacheKey);
    if (cacheGot) {
      return JSON.parse(cacheGot);
    }
    let cacheData: GetVideoResponse | GetVideoFestivalResponse;

    const { finalUrl, response } = await this.fetchRaw(`${this.sitePrefix}/${id}/?p=${episode}`);

    this.logger.debug(`最终跳转结果：${finalUrl}`);
    if (finalUrl.startsWith("https://www.bilibili.com/festival/")) {
      this.logger.debug(`按照活动视频处理该查询`);
      // 提取视频播放信息
      const initialState: InitialStateFestivalResponse = extractJSON(
        /window\.__INITIAL_STATE__=(\{.+});\(function\(\)\{/,
        response,
      );

      // 提取视频流信息
      const playInfo = await this.getVideoUrlFestival(
        finalUrl,
        initialState.videoInfo.aid,
        initialState.videoInfo.bvid,
        initialState.videoInfo.pages[0].cid,
      );

      cacheData = { type: "festival", initialState, playInfo };
    } else {
      // 提取视频播放信息
      this.logger.debug(`按照常规视频处理该查询`);
      const initialState: InitialStateResponse = extractJSON(
        /window\.__INITIAL_STATE__=(\{.+});\(function\(\){/,
        response,
      );
      let playInfo: WebPlayInfo;
      try {
        playInfo = extractJSON(/window\.__playinfo__=(\{.+})<\/script><script>window.__INITIAL_STATE__=/, response);
      } catch (e) {
        this.logger.debug(`匹配关键词失败：${e}`);
        if (initialState.videoData.pages) {
          this.logger.debug("正在采用降级方案……");
          playInfo = await this.getVideoUrlFestival(
            finalUrl,
            initialState.videoData.aid,
            initialState.videoData.bvid,
            initialState.videoData.pages.find(e => e.page === Number(episode))?.cid ?? 0,
          );
        } else {
          throw e;
        }
      }

      cacheData = { type: "regular", initialState, playInfo };
    }
    await this.cacheProvider.set(cacheKey, JSON.stringify(cacheData));
    return cacheData;
  }

  private async getVideoUrlFestival(
    referer: string,
    avid: Numberish,
    bvid: string,
    cid: Numberish,
  ): Promise<WebPlayInfo> {
    const cacheKey = `bilisound_getVideoUrlFestival_${avid}_${bvid}_${cid}`;
    const cacheGot = await this.cacheProvider.get(cacheKey);
    if (cacheGot) {
      return JSON.parse(cacheGot);
    }
    const response = await this.request<WebPlayInfo>({
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
    await this.cacheProvider.set(cacheKey, JSON.stringify(response));
    return response;
  }

  private async getUserSeason(userId: Numberish, seasonId: Numberish, pageNum = 1): Promise<UserSeasonInfo> {
    const cacheKey = `bilisound_getUserSeason_${userId}_${seasonId}_${pageNum}`;
    const cacheGot = await this.cacheProvider.get(cacheKey);
    if (cacheGot) {
      return JSON.parse(cacheGot);
    }
    const response = await this.request<UserSeasonInfo>({
      url: "/x/polymer/web-space/seasons_archives_list",
      params: {
        mid: userId,
        season_id: seasonId,
        sort_reverse: false,
        page_num: pageNum,
        page_size: 30,
      },
      headers: {
        referer: `https://space.bilibili.com/${userId}/lists/${seasonId}?type=season`,
      },
    });
    await this.cacheProvider.set(cacheKey, JSON.stringify(response));
    return response;
  }

  private async getUserSeries(userId: Numberish, seriesId: Numberish, pageNum = 1): Promise<UserSeriesInfo> {
    const cacheKey = `bilisound_getUserSeries_${userId}_${seriesId}_${pageNum}`;
    const cacheGot = await this.cacheProvider.get(cacheKey);
    if (cacheGot) {
      return JSON.parse(cacheGot);
    }
    const response = await this.request<UserSeriesInfo>({
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
        referer: `https://space.bilibili.com/${userId}/lists/${seriesId}?type=series`,
      },
    });
    await this.cacheProvider.set(cacheKey, JSON.stringify(response));
    return response;
  }

  private async getUserSeriesMeta(seriesId: Numberish): Promise<UserSeriesMetadata> {
    const cacheKey = `bilisound_getUserSeriesMeta_${seriesId}`;
    const cacheGot = await this.cacheProvider.get(cacheKey);
    if (cacheGot) {
      return JSON.parse(cacheGot);
    }
    const response = await this.request<UserSeriesMetadata>({
      url: "/x/series/series",
      params: {
        series_id: seriesId,
      },
      disableWbi: true,
    });
    await this.cacheProvider.set(cacheKey, JSON.stringify(response));
    return response;
  }
}
