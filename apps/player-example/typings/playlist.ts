import { UserListMode } from "~/api/bilisound";
import { Numberish } from "~/typings/common";

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
