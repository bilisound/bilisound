import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 定义 playlist_meta 表
export const playlistMeta = sqliteTable("playlist_meta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  color: text("color").notNull(),
  amount: integer("amount").notNull(),
  imgUrl: text("img_url"),
  description: text("description"),
  source: text("source"),
  filterRules: text("filter_rules"),
  extendedData: text("extended_data"),
});

// 定义 playlist_detail 表
export const playlistDetail = sqliteTable("playlist_detail", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playlistId: integer("playlist_id")
    .notNull()
    .references(() => playlistMeta.id),
  author: text("author").notNull(),
  bvid: text("bvid").notNull(),
  duration: integer("duration").notNull(),
  episode: integer("episode").notNull(),
  title: text("title").notNull(),
  imgUrl: text("img_url").notNull(),
  extendedData: text("extended_data"),
});

export const playlistMetaInsertSchema = createInsertSchema(playlistMeta);

export const playlistDetailInsertSchema = createInsertSchema(playlistDetail, {
  // 存量数据兼容处理
  playlistId: z.union([z.string(), z.number()]),
});

export const playlistImportSchema = z.object({
  kind: z.literal("moe.bilisound.app.exportedPlaylist"),
  version: z.literal(1),
  meta: z.array(playlistMetaInsertSchema),
  detail: z.array(playlistDetailInsertSchema),
});

export type PlaylistMeta = InferSelectModel<typeof playlistMeta>;

export type PlaylistDetail = InferSelectModel<typeof playlistDetail>;

export type PlaylistMetaInsert = InferInsertModel<typeof playlistMeta>;

export type PlaylistDetailInsert = InferInsertModel<typeof playlistDetail>;

export type PlaylistImport = z.infer<typeof playlistImportSchema>;
