import type {
  PlaylistDetail as PlaylistDetailRow,
  PlaylistDetailInsert as PlaylistDetailInsertRow,
  PlaylistMeta as PlaylistMetaRow,
  PlaylistMetaInsert as PlaylistMetaInsertRow,
} from "~/storage/sqlite/schema";
import type { PlaylistSource } from "~/typings/playlist";

import type { PlaylistExport } from "../exchange";
import type { PlayableItem, Playlist, PlaylistCreateInput } from "../models";
import type { PlaylistRepository } from "../repository-contract";

const sampleSource: PlaylistSource = {
  type: "video",
  bvid: "BV1test",
  originalTitle: "Source video",
  lastSyncAt: 123,
};

const sampleMetaRow: PlaylistMetaRow = {
  id: 1,
  title: "Test playlist",
  color: "#ffffff",
  amount: 1,
  imgUrl: null,
  description: null,
  source: JSON.stringify(sampleSource),
  filterRules: null,
  extendedData: null,
};

const samplePlaylist: Playlist = {
  ...sampleMetaRow,
  source: sampleSource,
};

const sampleDetailRow: PlaylistDetailRow = {
  id: 1,
  playlistId: 1,
  author: "Test author",
  bvid: "BV1test",
  duration: 120,
  episode: 1,
  title: "Test track",
  imgUrl: "https://example.com/cover.jpg",
  extendedData: null,
};

const samplePlayableItem: PlayableItem = {
  author: sampleDetailRow.author,
  bvid: sampleDetailRow.bvid,
  duration: sampleDetailRow.duration,
  episode: sampleDetailRow.episode,
  title: sampleDetailRow.title,
  imgUrl: sampleDetailRow.imgUrl,
};

const sampleCreateInput: PlaylistCreateInput = {
  title: samplePlaylist.title,
  color: samplePlaylist.color,
  source: sampleSource,
};

const sampleExport: PlaylistExport = {
  kind: "moe.bilisound.app.exportedPlaylist",
  version: 1,
  meta: [sampleMetaRow],
  detail: [sampleDetailRow],
};

interface PlaylistStorageMock {
  getPlaylistMetas: jest.Mock<Promise<PlaylistMetaRow[]>, [filterHasSource?: boolean]>;
  getPlaylistMeta: jest.Mock<Promise<PlaylistMetaRow[] | undefined>, [id: number]>;
  deletePlaylistMeta: jest.Mock<Promise<void>, [id: number]>;
  setPlaylistMeta: jest.Mock<Promise<void>, [meta: Partial<PlaylistMetaInsertRow> & { id: number }]>;
  insertPlaylistMeta: jest.Mock<Promise<{ lastInsertRowId: number }>, [meta: PlaylistMetaInsertRow]>;
  getPlaylistDetail: jest.Mock<Promise<PlaylistDetailRow[]>, [playlistId: number]>;
  deletePlaylistDetail: jest.Mock<Promise<void>, [id: number]>;
  addToPlaylist: jest.Mock<Promise<void>, [playlistId: number, playlist: PlaylistDetailInsertRow[]]>;
  syncPlaylistAmount: jest.Mock<Promise<void>, [playlistId: number]>;
  replacePlaylistDetail: jest.Mock<Promise<void> | void, [playlistId: number, playlist: PlaylistDetailInsertRow[]]>;
  exportPlaylist: jest.Mock<Promise<PlaylistExport>, [id: number]>;
  exportAllPlaylist: jest.Mock<Promise<PlaylistExport>, []>;
  clonePlaylist: jest.Mock<Promise<number | undefined>, [playlistId: number]>;
  deleteAllPlaylist: jest.Mock<Promise<void>, []>;
}

function createStorageMock(): PlaylistStorageMock {
  return {
    getPlaylistMetas: jest.fn(async (_filterHasSource?: boolean) => [sampleMetaRow]),
    getPlaylistMeta: jest.fn(async (_id: number) => [sampleMetaRow]),
    deletePlaylistMeta: jest.fn(async (_id: number) => undefined),
    setPlaylistMeta: jest.fn(async (_meta: Partial<PlaylistMetaInsertRow> & { id: number }) => undefined),
    insertPlaylistMeta: jest.fn(async (_meta: PlaylistMetaInsertRow) => ({ lastInsertRowId: 2 })),
    getPlaylistDetail: jest.fn(async (_playlistId: number) => [sampleDetailRow]),
    deletePlaylistDetail: jest.fn(async (_id: number) => undefined),
    addToPlaylist: jest.fn(async (_playlistId: number, _playlist: PlaylistDetailInsertRow[]) => undefined),
    syncPlaylistAmount: jest.fn(async (_playlistId: number) => undefined),
    replacePlaylistDetail: jest.fn(async (_playlistId: number, _playlist: PlaylistDetailInsertRow[]) => undefined),
    exportPlaylist: jest.fn(async (_id: number) => sampleExport),
    exportAllPlaylist: jest.fn(async () => sampleExport),
    clonePlaylist: jest.fn(async (_playlistId: number) => 2),
    deleteAllPlaylist: jest.fn(async () => undefined),
  };
}

type RepositoryMethod = (...args: never[]) => Promise<unknown>;
type PlatformName = "native" | "web";

function loadRepository(platform: PlatformName) {
  jest.resetModules();
  const storage = createStorageMock();
  const transaction = jest.fn((callback: (tx: unknown) => void) => {
    const run = jest.fn(() => ({ changes: 1, lastInsertRowId: 2 }));
    const values = jest.fn(() => ({ run }));
    const insert = jest.fn(() => ({ values }));
    callback({ insert });
  });

  jest.doMock("~/storage/sqlite/playlist", () => storage);
  jest.doMock("~/storage/sqlite/main", () => ({ db: { transaction } }));
  jest.doMock("~/storage/sqlite/schema", () => ({
    playlistMeta: { table: "playlistMeta" },
    playlistDetail: { table: "playlistDetail" },
  }));

  const repository = jest.requireActual(platform === "native" ? "../repository" : "../repository.web") as Pick<
    PlaylistRepository,
    keyof PlaylistRepository
  >;

  return { repository, storage, transaction };
}

function repositoryCalls(): [keyof PlaylistRepository, unknown[]][] {
  return [
    ["getPlaylistMetas", []],
    ["getPlaylistMeta", [1]],
    ["deletePlaylistMeta", [1]],
    ["setPlaylistMeta", [{ id: 1, title: "Updated" }]],
    ["insertPlaylistMeta", [sampleCreateInput]],
    ["getPlaylistDetail", [1]],
    ["deletePlaylistDetail", [1]],
    ["addToPlaylist", [1, [samplePlayableItem]]],
    ["syncPlaylistAmount", [1]],
    ["replacePlaylistDetail", [1, [samplePlayableItem]]],
    ["quickCreatePlaylist", ["New playlist", "Description", [samplePlayableItem]]],
    ["exportPlaylist", [1]],
    ["exportAllPlaylist", []],
    ["clonePlaylist", [1]],
    ["deleteAllPlaylist", []],
    ["importPlaylistBatch", [[{ playlist: sampleCreateInput, tracks: [samplePlayableItem] }]]],
  ];
}

function runSharedContract(platform: PlatformName) {
  describe(`${platform} repository`, () => {
    let repository: PlaylistRepository;
    let storage: PlaylistStorageMock;

    beforeEach(() => {
      ({ repository, storage } = loadRepository(platform));
    });

    afterEach(() => {
      jest.dontMock("~/storage/sqlite/playlist");
      jest.dontMock("~/storage/sqlite/main");
      jest.dontMock("~/storage/sqlite/schema");
      jest.resetModules();
    });

    it("returns a Promise from every public operation", async () => {
      for (const [name, args] of repositoryCalls()) {
        const result = (repository[name] as RepositoryMethod)(...(args as never[]));
        expect(result).toBeInstanceOf(Promise);
        await result;
      }
    });

    it("maps persistence rows to app-owned domain models", async () => {
      await expect(repository.getPlaylistMetas()).resolves.toEqual([samplePlaylist]);
      await expect(repository.getPlaylistMeta(1)).resolves.toEqual(samplePlaylist);
      await expect(repository.getPlaylistDetail(1)).resolves.toEqual([sampleDetailRow]);
    });

    it("maps domain writes to persistence rows", async () => {
      await repository.insertPlaylistMeta(sampleCreateInput);
      expect(storage.insertPlaylistMeta).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 0, source: JSON.stringify(sampleSource) }),
      );

      await repository.addToPlaylist(7, [samplePlayableItem]);
      expect(storage.addToPlaylist).toHaveBeenCalledWith(7, [
        expect.objectContaining({ ...samplePlayableItem, playlistId: 7 }),
      ]);
    });

    it("normalizes a missing playlist meta to null", async () => {
      storage.getPlaylistMeta.mockResolvedValueOnce(undefined);
      await expect(repository.getPlaylistMeta(404)).resolves.toBeNull();
    });

    it("converts synchronous storage failures into Promise rejections", async () => {
      storage.replacePlaylistDetail.mockImplementationOnce(() => {
        throw new Error("replace failed");
      });

      const result = repository.replacePlaylistDetail(1, [samplePlayableItem]);
      expect(result).toBeInstanceOf(Promise);
      await expect(result).rejects.toThrow("replace failed");
    });

    it("rejects cloning a missing playlist instead of returning undefined", async () => {
      storage.clonePlaylist.mockResolvedValueOnce(undefined);
      await expect(repository.clonePlaylist(404)).rejects.toThrow("Playlist 404 not found");
    });
  });
}

runSharedContract("native");
runSharedContract("web");

describe("platform persistence adapters", () => {
  it("imports a native playlist in one SQLite transaction", async () => {
    const { repository, transaction } = loadRepository("native");

    await repository.importPlaylistBatch([{ playlist: sampleCreateInput, tracks: [samplePlayableItem] }]);

    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("awaits the Web metadata and detail writes", async () => {
    const { repository, storage } = loadRepository("web");
    let resolveDetailWrite!: () => void;
    let notifyDetailWriteStarted!: () => void;
    const detailWriteStarted = new Promise<void>(resolve => {
      notifyDetailWriteStarted = resolve;
    });
    const detailWrite = new Promise<void>(resolve => {
      resolveDetailWrite = resolve;
    });
    storage.addToPlaylist.mockImplementationOnce(() => {
      notifyDetailWriteStarted();
      return detailWrite;
    });

    const operation = repository.importPlaylistBatch([{ playlist: sampleCreateInput, tracks: [samplePlayableItem] }]);
    let settled = false;
    void operation.then(() => {
      settled = true;
    });
    await detailWriteStarted;

    expect(settled).toBe(false);
    expect(storage.insertPlaylistMeta).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1, source: JSON.stringify(sampleSource) }),
    );
    expect(storage.addToPlaylist).toHaveBeenCalledWith(2, [
      expect.objectContaining({ ...samplePlayableItem, playlistId: 2 }),
    ]);

    resolveDetailWrite();
    await operation;
    expect(settled).toBe(true);
  });
});
