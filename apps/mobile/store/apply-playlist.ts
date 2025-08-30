import { PlaylistDetail } from "~/storage/sqlite/schema";
import { PlaylistSource } from "~/typings/playlist";
import { createWithEqualityFn } from "zustand/traditional";

export interface ApplyPlaylistProps {
  playlistDetail: PlaylistDetail[] | null;
  name: string;
  description: string;
  source?: PlaylistSource;
  cover?: string;
}

export interface ApplyPlaylistMethods {
  setPlaylistDetail: (playlistDetail: ApplyPlaylistProps["playlistDetail"]) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setSource: (source?: PlaylistSource) => void;
  setCover: (cover?: string) => void;
}

const useApplyPlaylistStore = createWithEqualityFn<ApplyPlaylistProps & ApplyPlaylistMethods>()(setState => ({
  playlistDetail: [],
  setPlaylistDetail: playlistDetail => setState(() => ({ playlistDetail })),
  name: "",
  setName: name => setState(() => ({ name })),
  description: "",
  setDescription: description => setState(() => ({ description })),
  source: undefined,
  setSource: source => setState(() => ({ source })),
  cover: undefined,
  setCover: cover => setState(() => ({ cover })),
}));

export default useApplyPlaylistStore;
