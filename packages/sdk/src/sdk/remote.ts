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
import { InitialStateFestivalResponse, InitialStateResponse, WebPlayInfo } from "../types-vendor";
import { BilisoundSDK } from "./base";
import { Numberish } from "../types";

export class BilisoundSDKRemote extends BilisoundSDK {
    apiPrefix: string;

    constructor(apiPrefix: string) {
        super();
        this.apiPrefix = apiPrefix;
    }

    private async fetchApi(endpoint: string, params?: Record<string, any>): Promise<any> {
        const url = new URL(this.apiPrefix + endpoint);
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.set(key, String(params[key]));
                }
            });
        }

        const response = await fetch(url.toString());

        const data = await response.json();

        if (data.code !== 200 && data.code !== 0) {
            throw new Error(data.msg ?? "未知错误");
        }

        return data.data;
    }

    async parseB23(id: string): Promise<string> {
        const result = await this.fetchApi("/internal/resolve-b23", { id });
        return result;
    }

    async getMetadata(id: string): Promise<GetMetadataResponse> {
        const result = await this.fetchApi("/internal/metadata", { id });
        return result;
    }

    async getResourceUrl(
        id: string,
        episode: number | string,
        filterResourceURL = false,
    ): Promise<GetResourceUrlResponse> {
        const result = await this.fetchApi("/internal/resource", {
            id,
            episode,
            filter: filterResourceURL,
        });
        return result;
    }

    async getUserList(
        mode: UserListMode,
        userId: Numberish,
        listId: Numberish,
        page = 1,
    ): Promise<GetEpisodeUserResponse> {
        const result = await this.fetchApi("/internal/user-list", {
            mode,
            userId,
            listId,
            page,
        });
        return result;
    }

    async getUserListFull(
        mode: UserListMode,
        userId: Numberish,
        listId: Numberish,
        progressCallback?: (progress: number) => void,
    ): Promise<EpisodeItem[]> {
        progressCallback?.(0);
        const result = await this.fetchApi("/internal/user-list-all", {
            mode,
            userId,
            listId,
        });
        progressCallback?.(1);
        return result;
    }
}
