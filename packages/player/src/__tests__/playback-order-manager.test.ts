import { PlaybackOrderManager } from "../playback-order-manager";

function collectPlaybackOrder(manager: PlaybackOrderManager, startIndex: number): number[] {
  const order = [startIndex];
  let currentIndex = startIndex;
  while (true) {
    const nextIndex = manager.getNextIndex(currentIndex);
    if (nextIndex < 0) {
      return order;
    }
    order.push(nextIndex);
    currentIndex = nextIndex;
  }
}

describe("PlaybackOrderManager", () => {
  it("keeps the current occurrence first and visits every occurrence once", () => {
    const manager = new PlaybackOrderManager(() => 0);
    manager.reset(4, 1);
    manager.setShuffleEnabled(true, 1);

    const order = collectPlaybackOrder(manager, 1);

    expect(order[0]).toBe(1);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    expect(new Set(order).size).toBe(4);
  });

  it("tracks duplicate media as independent queue occurrences", () => {
    const manager = new PlaybackOrderManager(() => 0);
    manager.reset(3, 0);
    manager.setShuffleEnabled(true, 0);

    const tokens = [0, 1, 2].map(index => manager.getOccurrenceToken(index));
    const order = collectPlaybackOrder(manager, 0);

    expect(new Set(tokens).size).toBe(3);
    expect(new Set(order).size).toBe(3);
  });

  it("rebuilds playback order when replacing a shuffled queue", () => {
    const manager = new PlaybackOrderManager(() => 0);
    manager.reset(4, 0);
    manager.setShuffleEnabled(true, 0);

    manager.reset(2, 1);
    const order = collectPlaybackOrder(manager, 1);

    expect(order[0]).toBe(1);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1]);
  });

  it("preserves existing occurrences while inserting and removing tracks", () => {
    const manager = new PlaybackOrderManager(() => 0);
    manager.reset(3, 1);
    const currentToken = manager.getOccurrenceToken(1)!;
    manager.setShuffleEnabled(true, 1);

    manager.insert(1, 2, 3);
    expect(manager.getCanonicalIndex(currentToken)).toBe(3);
    expect(new Set(collectPlaybackOrder(manager, 3)).size).toBe(5);

    manager.remove([0, 2]);
    const currentIndex = manager.getCanonicalIndex(currentToken);
    expect(currentIndex).toBe(1);
    expect(new Set(collectPlaybackOrder(manager, currentIndex)).size).toBe(3);
  });

  it("returns canonical neighbors when shuffle is disabled", () => {
    const manager = new PlaybackOrderManager(() => 0);
    manager.reset(3, 1);

    expect(manager.getPreviousIndex(1)).toBe(0);
    expect(manager.getNextIndex(1)).toBe(2);
    expect(manager.getNextIndex(2)).toBe(-1);
  });
});
