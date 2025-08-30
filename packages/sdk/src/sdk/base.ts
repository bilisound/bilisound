import {
    EpisodeItem,
    GetEpisodeUserResponse,
    GetMetadataResponse,
    GetResourceUrlResponse,
    Numberish,
    UserListMode,
} from "@/types";

export abstract class BilisoundSDK {
    abstract parseB23(id: string): Promise<string>;

    abstract getMetadata(id: string): Promise<GetMetadataResponse>;

    abstract getResourceUrl(
        id: string,
        episode: number | string,
        filterResourceURL?: boolean,
    ): Promise<GetResourceUrlResponse>;

    abstract getUserList(
        mode: UserListMode,
        userId: Numberish,
        listId: Numberish,
        page?: number,
    ): Promise<GetEpisodeUserResponse>;

    abstract getUserListFull(
        mode: UserListMode,
        userId: Numberish,
        listId: Numberish,
        progressCallback?: (progress: number) => void,
    ): Promise<EpisodeItem[]>;
}
