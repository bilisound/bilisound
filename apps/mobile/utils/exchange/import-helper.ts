import { parse } from "smol-toml";
import { PlaylistDetailInsert, playlistImportSchema, PlaylistMetaInsert } from "~/storage/sqlite/schema";

interface MigratePlan {
  meta: PlaylistMetaInsert;
  detail: PlaylistDetailInsert[];
}

export function importHelper(content: string) {
  const parsed = parse(content);
  const validationResult = playlistImportSchema.parse(parsed);
  const migratePlan: MigratePlan[] = [];
  for (let i = 0; i < validationResult.meta.length; i++) {
    const meta = validationResult.meta[i];
    const detail = validationResult.detail
      .filter(e => String(e.playlistId) === String(meta.id)) // 存量数据兼容处理
      .map(e => ({ ...e, playlistId: -1 }));
    if (!meta.imgUrl && detail.length > 0) {
      meta.imgUrl = detail[0].imgUrl;
    }
    migratePlan.push({
      meta,
      detail,
    });
  }
  return migratePlan;
}
