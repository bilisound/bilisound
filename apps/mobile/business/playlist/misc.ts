import useApplyPlaylistStore, { ApplyPlaylistProps } from "~/store/apply-playlist";
import { router } from "expo-router";

export function openAddPlaylistPage(args: ApplyPlaylistProps) {
  const { setPlaylistDetail, setName, setDescription, setSource, setCover } = useApplyPlaylistStore.getState();
  setPlaylistDetail(args.playlistDetail);
  setName(args.name);
  setDescription(args.description);
  setSource(args.source);
  setCover(args.cover);
  router.push(`/apply-playlist`);
}
