import type { TrackData } from "~/features/player";

/** Queue and order arrive through separate subscriptions; keep canonical indexes when they disagree. */
export function orderQueue(queue: TrackData[], playbackOrder: number[]) {
  const valid =
    playbackOrder.length === queue.length &&
    new Set(playbackOrder).size === queue.length &&
    playbackOrder.every(index => Number.isInteger(index) && index >= 0 && index < queue.length);
  const indexes = valid ? playbackOrder : queue.map((_, index) => index);
  return indexes.map(canonicalIndex => ({ track: queue[canonicalIndex], canonicalIndex }));
}
