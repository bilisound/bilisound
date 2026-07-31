import type { RemotePlaylistMode } from "~/features/bilibili";
import type { Numberish } from "~/typings/common";

export type PlaylistSource =
  | {
      type: "video";
      originalTitle: string;
      lastSyncAt: number;
      bvid: string;
    }
  | {
      type: "playlist";
      originalTitle: string;
      lastSyncAt: number;
      subType: RemotePlaylistMode;
      userId: Numberish;
      listId: Numberish;
    };
