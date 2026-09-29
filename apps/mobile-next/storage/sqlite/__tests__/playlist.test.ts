describe("playlist SQLite storage", () => {
  afterEach(() => {
    jest.dontMock("~/storage/sqlite/main");
    jest.resetModules();
  });

  it("does not reuse the previous insert ID when the source playlist is missing", async () => {
    const run = jest.fn(() => ({ changes: 0, lastInsertRowId: 99 }));
    const transaction = jest.fn((callback: (tx: { run: typeof run }) => unknown) => callback({ run }));
    jest.doMock("~/storage/sqlite/main", () => ({ db: { transaction } }));

    let clonePlaylist!: (playlistId: number) => Promise<number | undefined>;
    jest.isolateModules(() => {
      ({ clonePlaylist } = jest.requireActual("../playlist"));
    });

    await expect(clonePlaylist(404)).resolves.toBeUndefined();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
