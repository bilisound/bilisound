import { v4 } from "uuid";
import { persist } from "zustand/middleware";

import { createStorage } from "~/storage/zustand";
import log from "../utils/logger";
import { createWithEqualityFn } from "zustand/traditional";

export interface HistoryItem {
  name: string;
  id: string;
  authorName: string;
  thumbnailUrl: string;
  visitedAt: Date;
  key: string;
}

export interface HistoryProps {
  historyList: HistoryItem[];
}

export interface HistoryMethods {
  setHistoryList: (historyList: HistoryItem[]) => void;
  appendHistoryList: (historyItem: HistoryItem) => void;
  clearHistoryList: () => void;
  swapHistoryList: (index1: number, index2?: number) => void;
  removeHistoryList: (index: number) => void;
  repairHistoryList: () => void;
}

const initialState: HistoryProps = {
  historyList: [],
};

const useHistoryStore = createWithEqualityFn<HistoryProps & HistoryMethods>()(
  persist(
    (set, get) => ({
      ...initialState,
      repairHistoryList: () => {
        log.debug("尝试检查历史记录列表是否需要修复");
        const historyList = get().historyList;
        let needSave = false;
        for (let i = 0; i < historyList.length; i++) {
          const e = historyList[i];
          if (!e.key) {
            e.key = v4();
            needSave = true;
          }
        }
        if (needSave) {
          log.debug("历史记录列表修复完成，正在保存");
          set(() => ({ historyList }));
        } else {
          log.debug("历史记录列表不需要修复");
        }
      },
      setHistoryList: historyList => set(() => ({ historyList })),
      appendHistoryList: historyItem => {
        let historyList = get().historyList;

        // 重复打开不添加历史记录
        if (historyItem.id === historyList[0]?.id) {
          return;
        }

        // 如果列表中有旧的同 ID 记录，先将其删除
        const foundIndex = historyList.findIndex(e => e.id === historyItem.id);
        if (foundIndex >= 0) {
          historyList.splice(foundIndex, 1);
        }

        // 添加历史记录
        historyList.unshift(historyItem);

        // 如果超过 100 项则删除最后一项
        if (historyList.length > 100) {
          historyList = historyList.slice(0, 100);
        }

        set(() => ({ historyList }));
      },
      clearHistoryList: () => {
        set(() => ({ historyList: [] }));
      },
      swapHistoryList: (index1, index2 = 0) => {
        const historyList = get().historyList;
        [historyList[index1], historyList[index2]] = [historyList[index2], historyList[index1]];

        set(() => ({ historyList }));
      },

      removeHistoryList: index => {
        const historyList = get().historyList;
        historyList.splice(index, 1);

        set(() => ({ historyList }));
      },
    }),
    {
      name: "history-store",
      storage: createStorage<HistoryProps>(),
    },
  ),
);

export default useHistoryStore;
