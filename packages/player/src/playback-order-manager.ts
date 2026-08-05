type RandomSource = () => number;

function isCanonicalPermutation(order: readonly number[], size: number): boolean {
  if (order.length !== size) {
    return false;
  }
  const seen = new Set<number>();
  for (const index of order) {
    if (!Number.isInteger(index) || index < 0 || index >= size || seen.has(index)) {
      return false;
    }
    seen.add(index);
  }
  return true;
}

/**
 * Owns canonical queue occurrences and the playback order derived from them.
 *
 * Occurrence tokens are intentionally independent from TrackData.id: the same
 * media item may appear in a queue more than once and every occurrence must be
 * visited exactly once in a shuffle cycle.
 */
export class PlaybackOrderManager {
  private readonly random: RandomSource;
  private canonicalTokens: number[] = [];
  private playbackOrderTokens: number[] = [];
  private canonicalIndexByToken = new Map<number, number>();
  private playbackPositionByToken = new Map<number, number>();
  private nextToken = 0;
  private shuffleEnabled = false;

  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  get isShuffleEnabled(): boolean {
    return this.shuffleEnabled;
  }

  get size(): number {
    return this.canonicalTokens.length;
  }

  reset(size: number, currentIndex = -1): void {
    if (!Number.isInteger(size) || size < 0) {
      throw new RangeError("Queue size must be a non-negative integer");
    }

    this.canonicalTokens = Array.from({ length: size }, () => this.nextToken++);
    this.reindexCanonical();
    if (this.shuffleEnabled) {
      this.rebuildPlaybackOrder(currentIndex);
    } else {
      this.playbackOrderTokens = [];
      this.playbackPositionByToken.clear();
    }
  }

  insert(index: number, count: number, currentIndex = -1): void {
    if (!Number.isInteger(index) || index < 0 || index > this.canonicalTokens.length) {
      throw new RangeError("Insert index is outside the canonical queue");
    }
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError("Insert count must be a non-negative integer");
    }
    if (count === 0) {
      return;
    }

    const newTokens = Array.from({ length: count }, () => this.nextToken++);
    this.canonicalTokens.splice(index, 0, ...newTokens);
    this.reindexCanonical();

    if (!this.shuffleEnabled) {
      return;
    }
    if (this.playbackOrderTokens.length === 0) {
      this.rebuildPlaybackOrder(currentIndex);
      return;
    }

    this.playbackOrderTokens.push(...this.shuffle(newTokens));
    this.reindexPlaybackOrder();
  }

  remove(indices: readonly number[]): void {
    if (indices.length === 0) {
      return;
    }

    const normalized = [...new Set(indices)].sort((a, b) => b - a);
    const invalidIndex = normalized.find(
      index => !Number.isInteger(index) || index < 0 || index >= this.canonicalTokens.length,
    );
    if (invalidIndex !== undefined) {
      throw new RangeError(`Remove index ${invalidIndex} is outside the canonical queue`);
    }

    const removedTokens = new Set<number>();
    for (const index of normalized) {
      removedTokens.add(this.canonicalTokens[index]!);
      this.canonicalTokens.splice(index, 1);
    }
    this.playbackOrderTokens = this.playbackOrderTokens.filter(token => !removedTokens.has(token));
    this.reindexCanonical();
    this.reindexPlaybackOrder();
  }

  setShuffleEnabled(enabled: boolean, currentIndex: number): boolean {
    if (enabled === this.shuffleEnabled) {
      return false;
    }

    this.shuffleEnabled = enabled;
    if (enabled) {
      this.rebuildPlaybackOrder(currentIndex);
    } else {
      this.playbackOrderTokens = [];
      this.playbackPositionByToken.clear();
    }
    return true;
  }

  getNextIndex(currentIndex: number): number {
    if (!this.shuffleEnabled) {
      return currentIndex < this.canonicalTokens.length - 1 ? currentIndex + 1 : -1;
    }

    const currentToken = this.canonicalTokens[currentIndex];
    if (currentToken === undefined) {
      return this.getFirstIndex();
    }
    const position = this.playbackPositionByToken.get(currentToken);
    if (position === undefined || position >= this.playbackOrderTokens.length - 1) {
      return -1;
    }
    return this.canonicalIndexByToken.get(this.playbackOrderTokens[position + 1]!) ?? -1;
  }

  getPreviousIndex(currentIndex: number): number {
    if (!this.shuffleEnabled) {
      return currentIndex > 0 && currentIndex < this.canonicalTokens.length ? currentIndex - 1 : -1;
    }

    const currentToken = this.canonicalTokens[currentIndex];
    if (currentToken === undefined) {
      return -1;
    }
    const position = this.playbackPositionByToken.get(currentToken);
    if (position === undefined || position <= 0) {
      return -1;
    }
    return this.canonicalIndexByToken.get(this.playbackOrderTokens[position - 1]!) ?? -1;
  }

  getFirstIndex(): number {
    if (this.canonicalTokens.length === 0) {
      return -1;
    }
    if (!this.shuffleEnabled) {
      return 0;
    }
    return this.canonicalIndexByToken.get(this.playbackOrderTokens[0]!) ?? -1;
  }

  /**
   * Canonical indices in playback order.
   *
   * When shuffle is disabled the playback order is the canonical order, so the
   * identity permutation is returned rather than an empty array.
   */
  getPlaybackOrder(): number[] {
    if (!this.shuffleEnabled) {
      return this.canonicalTokens.map((_, index) => index);
    }
    return this.playbackOrderTokens.map(token => this.canonicalIndexByToken.get(token) ?? -1);
  }

  /**
   * Restores a previously captured playback order.
   *
   * Rejects anything that is not a permutation of the current canonical indices, so a
   * stale persisted order cannot desynchronize traversal from the queue.
   */
  setPlaybackOrder(order: readonly number[]): boolean {
    if (!this.shuffleEnabled || !isCanonicalPermutation(order, this.canonicalTokens.length)) {
      return false;
    }

    this.playbackOrderTokens = order.map(index => this.canonicalTokens[index]!);
    this.reindexPlaybackOrder();
    return true;
  }

  getOccurrenceToken(index: number): number | undefined {
    return this.canonicalTokens[index];
  }

  getCanonicalIndex(token: number): number {
    return this.canonicalIndexByToken.get(token) ?? -1;
  }

  private rebuildPlaybackOrder(currentIndex: number): void {
    const effectiveCurrentIndex =
      currentIndex >= 0 && currentIndex < this.canonicalTokens.length
        ? currentIndex
        : this.canonicalTokens.length > 0
          ? 0
          : -1;
    const currentToken = this.canonicalTokens[effectiveCurrentIndex];
    const remaining =
      currentToken === undefined
        ? [...this.canonicalTokens]
        : this.canonicalTokens.filter(token => token !== currentToken);
    const shuffled = this.shuffle(remaining);
    this.playbackOrderTokens = currentToken === undefined ? shuffled : [currentToken, ...shuffled];
    this.reindexPlaybackOrder();
  }

  private shuffle(tokens: readonly number[]): number[] {
    const shuffled = [...tokens];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const target = Math.floor(this.random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
    }
    return shuffled;
  }

  private reindexCanonical(): void {
    this.canonicalIndexByToken.clear();
    this.canonicalTokens.forEach((token, index) => this.canonicalIndexByToken.set(token, index));
  }

  private reindexPlaybackOrder(): void {
    this.playbackPositionByToken.clear();
    this.playbackOrderTokens.forEach((token, index) => this.playbackPositionByToken.set(token, index));
  }
}
