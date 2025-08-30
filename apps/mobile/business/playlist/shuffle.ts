import { QUEUE_IS_RANDOMIZED, QUEUE_PLAYING_MODE, QueuePlayingMode, queueStorage } from "~/storage/queue";
import { loadBackupTrackData } from "~/business/playlist/handler";
import {
  addTracks,
  deleteTracks,
  getCurrentTrackIndex,
  getProgress,
  getTracks,
  jump,
  seek,
  setQueue,
} from "@bilisound/player";
import { TrackData } from "@bilisound/player/build/types";
import { Platform } from "react-native";

/**
 * 切换播放模式
 */
export async function setMode(): Promise<QueuePlayingMode> {
  const mode = queueStorage.getString(QUEUE_PLAYING_MODE) as QueuePlayingMode | undefined;

  switch (mode) {
    case "shuffle": {
      const tracks = await loadBackupTrackData();
      queueStorage.set(QUEUE_PLAYING_MODE, "normal");
      queueStorage.set(QUEUE_IS_RANDOMIZED, false);
      await restoreQueue(tracks);
      return "normal";
    }
    case "normal":
    default: {
      queueStorage.set(QUEUE_PLAYING_MODE, "shuffle");
      queueStorage.set(QUEUE_IS_RANDOMIZED, true);
      await shuffleQueue();
      return "shuffle";
    }
  }
}

/**
 * Generates two arrays of indices before and after a given index in an array.
 * @param {number} length The length of the original array
 * @param {number} index The index to split at
 * @returns A tuple containing two arrays of indices
 */
function generateIndicesArrays(length: number, index: number) {
  if (index < 0 || index >= length) {
    throw new Error("Index out of bounds");
  }

  const beforeIndices = Array.from({ length: index }, (_, i) => i);
  const afterIndices = Array.from({ length: length - index - 1 }, (_, i) => i + index + 1);

  return [beforeIndices, afterIndices];
}

/**
 * Splits an array into two parts based on a given index.
 * @template T The type of elements in the array
 * @param {T[]} array The input array
 * @param {number} index The index to split at
 * @returns {[T[], T[]]} A tuple containing two arrays: elements before the index and elements after the index
 */
function splitArrayAtIndex<T>(array: T[], index: number): [T[], T[]] {
  if (index < 0 || index >= array.length) {
    throw new Error("Index out of bounds");
  }

  const beforeElements = array.slice(0, index);
  const afterElements = array.slice(index + 1);

  return [beforeElements, afterElements];
}

/**
 * 原地打乱数组（Fisher-Yates Shuffle 算法）
 * @param array
 */
function shuffleInPlace<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * shuffles the current Queue. The method returns a pre-shuffled Queue,
 * to revert shuffling, use setQueueUninterrupted().
 */
export async function shuffleQueue() {
  const currentQueue = await getTracks();
  const tracks = currentQueue.concat();
  shuffleInPlace(tracks);

  // if no currentTrack, it's a simple setQueue
  const currentTrackIndex = await getCurrentTrackIndex();

  // if currentTrack is not in tracks, it's a simple setQueue
  const currentTrack = currentQueue[currentTrackIndex];
  const currentTrackNewIndex = tracks.findIndex(
    // define conditions to find the currentTrack in tracks
    track =>
      track.extendedData &&
      currentTrack.extendedData &&
      track.extendedData.id === currentTrack.extendedData.id &&
      track.extendedData.episode === currentTrack.extendedData.episode,
  );

  console.log("currentTrackNewIndex", currentTrackNewIndex);
  if (currentTrackNewIndex < 0) {
    return setQueue(tracks);
  }

  // else, splice that all others are removed, new track list spliced
  // that the currentTrack becomes the first element.
  const removeTrackIndices = [...Array(currentQueue.length).keys()];
  removeTrackIndices.splice(currentTrackIndex, 1);
  await deleteTracks(removeTrackIndices);
  const splicedTracks = tracks.slice(currentTrackNewIndex + 1).concat(tracks.slice(0, currentTrackNewIndex));

  // log.debug(`edited tracks ${JSON.stringify({ splicedTracks })}`);
  await addTracks(splicedTracks);
  return currentQueue;
}

/**
 * Restores the queue to its original state before shuffling.
 * @param originalTracks The original, unshuffled list of tracks
 */
export async function restoreQueue(originalTracks: TrackData[]): Promise<void> {
  const currentTrackIndex = await getCurrentTrackIndex();
  const currentQueue = await getTracks();
  const progress = await getProgress();

  const currentTrack = currentQueue[currentTrackIndex];

  // Find the index of the current track in the original list
  const originalIndex = originalTracks.findIndex(
    track =>
      track.extendedData &&
      currentTrack.extendedData &&
      track.extendedData.id === currentTrack.extendedData.id &&
      track.extendedData.episode === currentTrack.extendedData.episode,
  );

  if (originalIndex < 0) {
    // If the current track is not in the original list, just set the queue to the original tracks
    return setQueue(originalTracks);
  }

  const [removeLeft, removeRight] = generateIndicesArrays(currentQueue.length, currentTrackIndex);

  // 移除当前播放的曲目后面的所有曲目
  await deleteTracks(removeRight);

  // 移除当前播放的曲目前面的所有曲目
  await deleteTracks(removeLeft);
  const [insertLeft, insertRight] = splitArrayAtIndex(originalTracks, originalIndex);

  // ! 這裏會導致 iOS 列表錯亂
  // 在前面插入新列表的曲目
  await addTracks(insertLeft, 0);

  // 在后面插入新列表的曲目
  await addTracks(insertRight);

  if (Platform.OS === "ios") {
    // ! 臨時解決方案，應該修改player部分
    await jump(originalIndex);
    await seek(progress.position);
  }
}
