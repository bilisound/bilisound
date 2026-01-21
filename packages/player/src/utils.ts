import { EventSubscription } from "expo-modules-core";
import { useSyncExternalStore } from "react";

import { addListener } from "./events";
import { Config } from "./player";
import { EventList, TrackData, TrackDataInternal } from "./types";

/**
 * TrackData 转 TrackDataInternal
 * @param trackData
 */
export function toTrackDataInternal(trackData: TrackData): TrackDataInternal {
  const userHeaders = trackData.headers ?? {};
  const headers = { ...Config.instance.defaultHeaders, ...userHeaders };
  return {
    id: trackData.id,
    uri: trackData.uri,
    artworkUri: trackData.artworkUri ?? null,
    title: trackData.title ?? null,
    artist: trackData.artist ?? null,
    duration: trackData.duration ?? null,
    mimeType: trackData.mimeType ?? null,
    headers: JSON.stringify(headers),
    extendedData: trackData.extendedData
      ? JSON.stringify(trackData.extendedData)
      : null,
  };
}

/**
 * TrackDataInternal 转 TrackData
 * @param trackDataInternal
 */
export function toTrackData(trackDataInternal: TrackDataInternal): TrackData {
  return {
    ...trackDataInternal,
    headers: trackDataInternal.headers
      ? JSON.parse(trackDataInternal.headers)
      : undefined,
    extendedData: trackDataInternal.extendedData
      ? JSON.parse(trackDataInternal.extendedData)
      : undefined,
  };
}

interface CreateSubscriptionStoreConfig<T> {
  eventName: keyof EventList;
  fetchData: () => Promise<T>;
  addListener: typeof addListener;
  initialValue: T;
  interval?: number;
}

/**
 * 快速创建面向播放器事件的 React Hook
 * @param eventName
 * @param fetchData
 * @param addListener
 * @param initialValue
 * @param interval 自动刷新间隔，不指定则不会自动刷新
 */
export function createSubscriptionStore<T>({
  eventName,
  fetchData,
  addListener,
  initialValue,
  interval,
}: CreateSubscriptionStoreConfig<T>) {
  // React 组件侧的监听器
  const progressListeners: Set<() => void> = new Set();

  // 当前读取的值
  let currentValue: T = initialValue;

  // Expo Modules 侧的监听器
  let EventSubscription: EventSubscription | undefined = undefined;

  // 自动读取计时器
  let timer: ReturnType<typeof setTimeout> | null = null;

  const doFetch = async () => {
    currentValue = await fetchData();
    progressListeners.forEach((listener) => listener());
  };

  const startFetching = () => {
    EventSubscription = addListener(eventName, doFetch);
    doFetch();
    if (typeof interval === "number" && timer === null) {
      timer = setInterval(doFetch, interval);
    }
  };

  const stopFetching = () => {
    EventSubscription?.remove();
    EventSubscription = undefined;
    if (typeof timer === "number") {
      clearInterval(timer);
      timer = null;
    }
  };

  const subscribe = (listener: () => void) => {
    progressListeners.add(listener);
    // 如果还没有 Expo Modules 侧的监听器，则开始监听
    if (!EventSubscription) {
      startFetching();
    }
    return () => {
      progressListeners.delete(listener);
      // 如果没有更多的监听器了，则停止监听
      if (progressListeners.size <= 0) {
        stopFetching();
      }
    };
  };

  const getSnapshot = () => {
    return currentValue;
  };

  return () => useSyncExternalStore(subscribe, getSnapshot);
}

export function deleteItems<T>(arr: T[], items: number[]) {
  // 首先将 items 进行排序（降序），然后从 items 中 index 最大的一项开始就地删除数组中的内容
  for (const index of items.toSorted((a, b) => b - a)) {
    arr.splice(index, 1);
  }
  return arr;
}
