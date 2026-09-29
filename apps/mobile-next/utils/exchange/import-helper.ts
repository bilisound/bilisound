import { parse } from "smol-toml";

import { buildPlaylistImportPlans } from "~/features/playlist";

export function importHelper(content: string) {
  return buildPlaylistImportPlans(parse(content));
}
