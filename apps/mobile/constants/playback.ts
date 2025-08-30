import { Asset } from "expo-asset";

export const URI_EXPIRE_DURATION = 90 * 60 * 1000;

export let PLACEHOLDER_AUDIO = "";

export async function loadPlaceholderAudio() {
  const asset = Asset.fromModule(require("../assets/placeholder.mp3"));
  await asset.downloadAsync();
  PLACEHOLDER_AUDIO = asset.localUri!;
}
