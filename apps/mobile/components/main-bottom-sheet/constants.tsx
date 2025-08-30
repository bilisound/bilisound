export const DEBUG_COLOR = ["", "", ""];

export const TABS = [
  {
    value: "current",
    label: "正在播放",
  },
  {
    value: "list",
    label: "播放队列",
  },
];

export const SPEED_PRESETS = [
  { speed: 0.8, text: "0.8x" },
  { speed: 0.9, text: "0.9x" },
  { speed: 1, text: "1x" },
  { speed: 1.1, text: "1.1x" },
  { speed: 1.2, text: "1.2x" },
];

export const REPEAT_MODE = {
  0: { name: "关闭循环", icon: "tabler:repeat-off", toastText: "关闭循环" },
  1: { name: "单曲循环", icon: "tabler:repeat-once", toastText: "使用单曲循环" },
  2: { name: "列表循环", icon: "tabler:repeat", toastText: "使用列表循环" },
};
