import { openDB, DBSchema, IDBPDatabase } from "idb";

import { PlaylistDetailInsert, PlaylistMetaInsert } from "./schema";
import { UserTheme } from "~/features/theme/types";

export interface MyDB extends DBSchema {
  playlistMeta: {
    key: number;
    value: PlaylistMetaInsert;
  };
  playlistDetail: {
    key: number;
    value: PlaylistDetailInsert;
    indexes: { "by-playlistId": number };
  };
  themeProfile: {
    key: string;
    value: UserTheme;
  };
  themeAsset: {
    key: string;
    value: {
      id: string;
      themeId: string;
      fileName: string;
      mimeType: "image/jpeg" | "image/png" | "image/webp";
      blob: Blob;
    };
    indexes: { "by-themeId": string };
  };
}

export let idb: IDBPDatabase<MyDB>;
let initPromise: Promise<IDBPDatabase<MyDB>> | null = null;

export async function initDatabase() {
  if (idb) return idb;
  initPromise ??= openDB<MyDB>("myDatabase", 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("playlistMeta", { keyPath: "id", autoIncrement: true });
        const playlistDetailStore = db.createObjectStore("playlistDetail", { keyPath: "id", autoIncrement: true });
        playlistDetailStore.createIndex("by-playlistId", "playlistId");
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("themeProfile")) {
          db.createObjectStore("themeProfile", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("themeAsset")) {
          const themeAssetStore = db.createObjectStore("themeAsset", { keyPath: "id" });
          themeAssetStore.createIndex("by-themeId", "themeId");
        }
      }
    },
  }).then(database => {
    idb = database;
    return database;
  });
  return initPromise;
}
