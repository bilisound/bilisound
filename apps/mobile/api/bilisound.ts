import { Platform } from "react-native";

import { defineWrap } from "./common";

import { BILISOUND_API_PREFIX, USER_AGENT_BILIBILI, USER_AGENT_BILISOUND } from "~/constants/network";
import { Numberish } from "~/typings/common";
import {
    GetMetadataResponse,
    GetEpisodeUserResponse,
    UserListMode,
    EpisodeItem,
    BilisoundSDKRemote,
    BilisoundSDKDirect,
} from "@bilisound/sdk";
import log from "~/utils/logger";

const sdk =
    Platform.OS === "web"
        ? new BilisoundSDKRemote(BILISOUND_API_PREFIX ?? "/api")
        : new BilisoundSDKDirect({
              userAgent: USER_AGENT_BILIBILI,
              apiPrefix: "https://api.bilibili.com",
              sitePrefix: "https://www.bilibili.com",
              key: "",
              logger: {
                  info: log.info.bind(log),
                  warn: log.warn.bind(log),
                  error: log.error.bind(log),
                  debug: log.debug.bind(log),
              },
          });

/**
 * 解析短链接
 */
export async function parseB23(id: string) {
    return sdk.parseB23(id);
}

/**
 * 获取视频元数据
 * @param data
 */
export async function getBilisoundMetadata(data: { id: string }): Promise<GetMetadataResponse> {
    return sdk.getMetadata(data.id);
}

export function getBilisoundResourceUrlOnline(id: string, episode: number | string, download?: "av" | "bv") {
    return {
        url:
            BILISOUND_API_PREFIX + `/internal/resource?id=${id}&episode=${episode}${download ? `&dl=${download}` : ""}`,
        isAudio: true,
    };
}

/**
 * 获取音频资源 URL
 * @param id
 * @param episode
 * @param filterResourceURL
 */
export async function getBilisoundResourceUrl(id: string, episode: number | string, filterResourceURL = false) {
    if (Platform.OS === "web") {
        return getBilisoundResourceUrlOnline(id, episode);
    }

    return sdk.getResourceUrl(id, episode, filterResourceURL);
}

/**
 * 获取用户列表（合集/列表）
 * @param mode
 * @param userId
 * @param listId
 * @param page
 */
export async function getUserList(
    mode: UserListMode,
    userId: Numberish,
    listId: Numberish,
    page = 1,
): Promise<GetEpisodeUserResponse> {
    return sdk.getUserList(mode, userId, listId, page);
}

/**
 * 一次性拉取完整用户列表（合集/列表）
 * @param mode
 * @param userId
 * @param listId
 * @param progressCallback
 */
export async function getUserListFull(
    mode: UserListMode,
    userId: Numberish,
    listId: Numberish,
    progressCallback?: (progress: number) => void,
): Promise<EpisodeItem[]> {
    return sdk.getUserListFull(mode, userId, listId, progressCallback);
}

export interface GetUpdateResponse {
    version: string;
    info: string;
    downloadPage: string;
    downloadUrl: string;
}

export async function getUpdate() {
    const response = await fetch(`${BILISOUND_API_PREFIX}/internal/app/update`, {
        headers: {
            "user-agent": USER_AGENT_BILISOUND,
        },
    });
    return defineWrap<GetUpdateResponse>(await response.json());
}
