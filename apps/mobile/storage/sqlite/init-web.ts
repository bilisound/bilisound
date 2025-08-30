import { openDB, DBSchema, IDBPDatabase } from "idb";

import { PlaylistDetailInsert, PlaylistMetaInsert } from "./schema";

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
}

export let idb: IDBPDatabase<MyDB>;

export async function initDatabase() {
  idb = await openDB<MyDB>("myDatabase", 1, {
    upgrade(db) {
      db.createObjectStore("playlistMeta", { keyPath: "id", autoIncrement: true });
      const playlistDetailStore = db.createObjectStore("playlistDetail", { keyPath: "id", autoIncrement: true });
      playlistDetailStore.createIndex("by-playlistId", "playlistId");
    },
  });
}
