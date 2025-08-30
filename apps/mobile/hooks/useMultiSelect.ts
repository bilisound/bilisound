import { useState } from "react";

/**
 * 列表多选管理 hook
 */
export default function useMultiSelect<T>() {
  const [rawData, setRawData] = useState({ value: new Set<T>() });

  function clear() {
    setRawData({
      value: new Set(),
    });
  }

  function toggle(item: T) {
    setRawData(({ value }) => {
      if (value.has(item)) {
        value.delete(item);
      } else {
        value.add(item);
      }
      return {
        value,
      };
    });
  }

  function set(item: T, has: boolean) {
    setRawData(({ value }) => {
      if (has) {
        value.add(item);
      } else {
        value.delete(item);
      }
      return {
        value,
      };
    });
  }

  function setAll(referenceList: T[]) {
    setRawData(({ value }) => {
      if (value.size >= referenceList.length) {
        return { value: new Set() };
      }
      referenceList.forEach(e => {
        value.add(e);
      });
      return {
        value,
      };
    });
  }

  function reverse(referenceList: T[]) {
    setRawData(({ value }) => {
      referenceList.forEach(e => {
        if (value.has(e)) {
          value.delete(e);
        } else {
          value.add(e);
        }
      });
      return {
        value,
      };
    });
  }

  return {
    clear,
    set,
    setAll,
    toggle,
    reverse,
    selected: rawData.value,
  };
}
