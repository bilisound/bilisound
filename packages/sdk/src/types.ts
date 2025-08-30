import { InitialStateResponse, WebPlayInfo, InitialStateFestivalResponse } from "./types-vendor";

export type Numberish = string | number;

export interface Logger {
  info(...msg: any[]): void;
  warn(...msg: any[]): void;
  error(...msg: any[]): void;
  debug(...msg: any[]): void;
}

export interface CacheProvider {
  get(key: string): Promise<string | null | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface SDKOptions {
  logger?: Logger;
  cacheProvider?: CacheProvider;
  userAgent?: string;
  apiPrefix?: string;
  sitePrefix?: string;
  key?: string;
}

export interface GetMetadataResponse {
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
  staff?: {
    mid: number;
    name: string;
    face: string;
    title: string;
  }[];
  pages: {
    page: number;
    part: string;
    partDisplayName: string;
    duration: number;
  }[];
  seasonId?: number;
}

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

export interface GetResourceUrlResponse {
  url: string;
  isAudio: boolean;
  volume?: WebPlayInfo["data"]["volume"];
}

export type UserListMode = "season" | "series";

export interface GetResourceOptions {
  method?: string;
  range?: string;
}
