import { useEffect, useCallback } from "react";

import { addListener } from "../events";
import { EventList } from "../types";

export function useEvents<T extends keyof EventList>(
  name: T,
  listener: (event: EventList[T]) => void,
  dependencies: any[] = [],
) {
  // 使用 useCallback 来保证 listener 的引用稳定性
  const stableListener = useCallback(listener, dependencies);

  useEffect(() => {
    const handler = addListener(name, stableListener);

    return () => {
      handler.remove();
    };
  }, [name, stableListener]); // 只在 name 或 stableListener 改变时重新订阅
}
