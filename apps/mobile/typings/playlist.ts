import { Numberish } from "~/typings/common";
import { UserListMode } from "@bilisound/sdk";

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
      subType: UserListMode;
      userId: Numberish;
      listId: Numberish;
    };
