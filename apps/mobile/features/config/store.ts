import { persist } from "zustand/middleware";
import { create } from "zustand";

import { createStorage } from "~/storage/zustand";

import type { SettingsMethods, SettingsProps } from "./types";

const initialState: SettingsProps = {
  // 使用 av 号
  useLegacyID: false,
  // 自动下载
  downloadNextTrack: true,
  // 过滤非 CDN 资源地址
  filterResourceURL: true,
  // 开发者模式
  debugMode: false,
  // 使用主题
  theme: "classic",
  // 显示网格歌单布局
  showPlaylistInGrid: false,
  // 显示看板娘
  showYuruChara: true,
};

/**
 * 配置持久化 store。这是 features/config 的内部实现，外部一律通过
 * selectors（响应式）或 policies（非响应式）读取，不要直接 import 本文件。
 */
export const useSettingsStore = create<SettingsProps & SettingsMethods>()(
  persist(
    (set, get) => ({
      ...initialState,
      update: (key, value) => {
        set(() => ({ [key]: value }));
      },
      toggle: key => {
        const old = get()[key];
        if (typeof old !== "boolean") {
          throw new Error("要切换开关状态的值类型必须是布尔值");
        }
        set(() => ({ [key]: !old }));
        return !old;
      },
    }),
    {
      name: "settings-store",
      storage: createStorage<SettingsProps>(),
    },
  ),
);

/** 初始化引导：从持久化恢复用户设置后再读取配置。 */
export async function rehydrateSettings(): Promise<void> {
  await useSettingsStore.persist.rehydrate();
}
