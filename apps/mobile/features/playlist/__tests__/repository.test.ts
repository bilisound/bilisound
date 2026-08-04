import type { PlaylistSource } from "~/typings/playlist";

import type { PlaylistDetail, PlaylistDetailInsert, PlaylistImport, PlaylistMeta, PlaylistMetaInsert } from "../models";
import type { PlaylistRepository } from "../repository-contract";

const sampleMeta: PlaylistMeta = {
  id: 1,
  title: "Test playlist",
  color: "#ffffff",
  amount: 1,
  imgUrl: null,
  description: null,
  source: null,
  filterRules: null,
  extendedData: null,
};

const sampleDetail: PlaylistDetail = {
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

const sampleMetaInsert: PlaylistMetaInsert = {
  title: sampleMeta.title,
  color: sampleMeta.color,
  amount: sampleMeta.amount,
};

const sampleExport: PlaylistImport = {
  kind: "moe.bilisound.app.exportedPlaylist",
  version: 1,
  meta: [sampleMeta],
  detail: [sampleDetail],
};

interface PlaylistStorageMock {
  getPlaylistMetas: jest.Mock<Promise<PlaylistMeta[]>, [filterHasSource?: boolean]>;
  getPlaylistMeta: jest.Mock<Promise<PlaylistMeta[] | undefined>, [id: number]>;
  deletePlaylistMeta: jest.Mock<Promise<void>, [id: number]>;
  setPlaylistMeta: jest.Mock<Promise<void>, [meta: Partial<PlaylistMetaInsert> & { id: number }]>;
  insertPlaylistMeta: jest.Mock<Promise<{ lastInsertRowId: number }>, [meta: PlaylistMetaInsert]>;
  getPlaylistDetail: jest.Mock<Promise<PlaylistDetail[]>, [playlistId: number]>;
  deletePlaylistDetail: jest.Mock<Promise<void>, [id: number]>;
  addToPlaylist: jest.Mock<Promise<void>, [playlistId: number, playlist: PlaylistDetailInsert[]]>;
  syncPlaylistAmount: jest.Mock<Promise<void>, [playlistId: number]>;
  replacePlaylistDetail: jest.Mock<Promise<void> | void, [playlistId: number, playlist: PlaylistDetailInsert[]]>;
  quickCreatePlaylist: jest.Mock<
    Promise<number>,
    [title: string, description: string, list: PlaylistDetail[], source?: PlaylistSource, imgUrl?: string]
  >;
  exportPlaylist: jest.Mock<Promise<PlaylistImport>, [id: number]>;
  exportAllPlaylist: jest.Mock<Promise<PlaylistImport>, []>;
  clonePlaylist: jest.Mock<Promise<number | undefined>, [playlistId: number]>;
  deleteAllPlaylist: jest.Mock<Promise<void>, []>;
}

function createStorageMock(): PlaylistStorageMock {
  return {
    getPlaylistMetas: jest.fn<Promise<PlaylistMeta[]>, [boolean?]>(async () => [sampleMeta]),
    getPlaylistMeta: jest.fn<Promise<PlaylistMeta[] | undefined>, [number]>(async () => [sampleMeta]),
    deletePlaylistMeta: jest.fn<Promise<void>, [number]>(async () => undefined),
    setPlaylistMeta: jest.fn<Promise<void>, [Partial<PlaylistMetaInsert> & { id: number }]>(async () => undefined),
    insertPlaylistMeta: jest.fn<Promise<{ lastInsertRowId: number }>, [PlaylistMetaInsert]>(async () => ({
      lastInsertRowId: 2,
    })),
    getPlaylistDetail: jest.fn<Promise<PlaylistDetail[]>, [number]>(async () => [sampleDetail]),
    deletePlaylistDetail: jest.fn<Promise<void>, [number]>(async () => undefined),
    addToPlaylist: jest.fn<Promise<void>, [number, PlaylistDetailInsert[]]>(async () => undefined),
    syncPlaylistAmount: jest.fn<Promise<void>, [number]>(async () => undefined),
    replacePlaylistDetail: jest.fn<Promise<void> | void, [number, PlaylistDetailInsert[]]>(async () => undefined),
    quickCreatePlaylist: jest.fn<Promise<number>, [string, string, PlaylistDetail[], PlaylistSource?, string?]>(
      async () => 2,
    ),
    exportPlaylist: jest.fn<Promise<PlaylistImport>, [number]>(async () => sampleExport),
    exportAllPlaylist: jest.fn<Promise<PlaylistImport>, []>(async () => sampleExport),
    clonePlaylist: jest.fn<Promise<number | undefined>, [number]>(async () => 2),
    deleteAllPlaylist: jest.fn<Promise<void>, []>(async () => undefined),
  };
}

type RepositoryMethod = (...args: never[]) => Promise<unknown>;
type PlatformName = "native" | "web";

function loadRepository(platform: PlatformName) {
  jest.resetModules();
  const storage = createStorageMock();
  const transaction = jest.fn((callback: (tx: unknown) => void) => {
    const run = jest.fn(() => ({ lastInsertRowId: 2 }));
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
    ["insertPlaylistMeta", [sampleMetaInsert]],
    ["getPlaylistDetail", [1]],
    ["deletePlaylistDetail", [1]],
    ["addToPlaylist", [1, [sampleDetail]]],
    ["syncPlaylistAmount", [1]],
    ["replacePlaylistDetail", [1, [sampleDetail]]],
    ["quickCreatePlaylist", ["New playlist", "Description", [sampleDetail]]],
    ["exportPlaylist", [1]],
    ["exportAllPlaylist", []],
    ["clonePlaylist", [1]],
    ["deleteAllPlaylist", []],
    ["importPlaylistBatch", [[{ meta: sampleMetaInsert, detail: [sampleDetail] }]]],
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

    it("normalizes a missing playlist meta to an empty list", async () => {
      storage.getPlaylistMeta.mockResolvedValueOnce(undefined);

      await expect(repository.getPlaylistMeta(404)).resolves.toEqual([]);
    });

    it("converts synchronous storage failures into Promise rejections", async () => {
      storage.replacePlaylistDetail.mockImplementationOnce(() => {
        throw new Error("replace failed");
      });

      const result = repository.replacePlaylistDetail(1, [sampleDetail]);
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

    await repository.importPlaylistBatch([{ meta: sampleMetaInsert, detail: [sampleDetail] }]);

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

    const operation = repository.importPlaylistBatch([{ meta: sampleMetaInsert, detail: [sampleDetail] }]);
    let settled = false;
    void operation.then(() => {
      settled = true;
    });
    await detailWriteStarted;

    expect(settled).toBe(false);
    expect(storage.insertPlaylistMeta).toHaveBeenCalledWith({ ...sampleMetaInsert, amount: 1, id: undefined });
    expect(storage.addToPlaylist).toHaveBeenCalledWith(2, [{ ...sampleDetail, id: 1, playlistId: 2 }]);

    resolveDetailWrite();
    await operation;
    expect(settled).toBe(true);
  });
});
