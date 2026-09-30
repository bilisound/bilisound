/**
 * discovery-episode-menu 回归测试（修复 §1 交付级缺口：已缓存分 P 的「保存到文件」）
 *
 * 1. 保存目标取长按的分 P（bvid/page/title），与当前播放曲目无关
 * 2. useLegacyID 开启时文件名使用 av 号（bv2av），与 v2 公式一致
 * 3. 保存失败展示真实错误，不误报成功；结束也只说「保存或分享操作已结束」
 * 4. web 仍保留下载入口，且不出现任何本地保存项
 * 5. native 已缓存菜单不含 v2 的「删除缓存」（决策 B：v2 该项误作用于当前曲目）
 */
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";

import type { VideoEpisode, VideoMetadata } from "~/features/bilibili";
import { getCacheAudioPath, useCacheExists } from "~/features/cache";
import { getResourcePolicy } from "~/features/config";
import { deleteCurrentTrackCache } from "~/features/playback";
import { saveAudioFile, uriToPath } from "~/utils/file";
import log from "~/utils/logger";
import { bv2av } from "~/utils/vendors/av-bv";
import { notify } from "~/components/feedback";

import { DiscoveryEpisodeMenu } from "../discovery-video-menu";

// 首次 TestRenderer 渲染要加载 RN 渲染机制，冷启动会顶到 jest 默认 5s 上限
jest.setTimeout(30000);

jest.mock("@bilisound/ui", () => {
  const ReactMock = jest.requireActual<typeof import("react")>("react");
  const host = (name: string) => (props: Record<string, unknown>) => ReactMock.createElement(name, props as never);
  return {
    ActionMenu: host("mock-action-menu"),
    Button: host("ui-button"),
    Text: host("ui-text"),
  };
});

jest.mock("@tamagui/core", () => {
  const ReactMock = jest.requireActual<typeof import("react")>("react");
  return { View: (props: Record<string, unknown>) => ReactMock.createElement("tamagui-view", props as never) };
});

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(async () => {}) }));

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual<typeof import("react")>("react");
  return { Image: (props: Record<string, unknown>) => ReactMock.createElement("expo-image", props as never) };
});

jest.mock("~/features/bilibili", () => ({
  getDownloadUrl: jest.fn(() => "https://example.com/download"),
  getVideoImageUrl: jest.fn(() => "https://example.com/cover.jpg"),
  getVideoUrl: jest.fn((id: string) => `https://www.bilibili.com/video/${id}`),
}));

jest.mock("~/features/bilibili/discovery", () => ({
  buildEpisodePlaylistDraft: jest.fn(() => ({})),
  buildVideoPlaylistDraft: jest.fn(() => ({})),
}));

jest.mock("~/features/cache", () => ({
  getCacheAudioPath: jest.fn(
    (id: string, episode: number, isTemp?: boolean) => `file:///offline/${id}_${episode}${isTemp ? ".tmp" : ".m4a"}`,
  ),
  getCacheStatusKey: jest.fn((id: string, episode: number) => `${id}_${episode}`),
  useCacheExists: jest.fn(() => true),
  useDownloadList: jest.fn(() => ({ downloadList: new Map() })),
}));

jest.mock("~/features/config", () => ({
  getResourcePolicy: jest.fn(() => ({ filterResourceURL: false, useLegacyID: false })),
}));

jest.mock("~/features/player", () => ({ pause: jest.fn(async () => {}) }));

jest.mock("~/features/playback", () => ({ deleteCurrentTrackCache: jest.fn(async () => {}) }));

jest.mock("~/features/playlist", () => ({ openAddPlaylistPage: jest.fn() }));

jest.mock("~/components/feedback", () => ({ notify: jest.fn() }));

jest.mock("~/components/discovery-download", () => ({
  cacheEpisodeToLocal: jest.fn(async () => "downloaded"),
  openDownloadWebEntry: jest.fn(),
}));

jest.mock("~/utils/file", () => ({
  saveAudioFile: jest.fn(async () => {}),
  uriToPath: jest.fn((uri: string) => uri.replace("file://", "")),
}));

jest.mock("~/utils/logger", () => ({
  __esModule: true,
  default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const bvid = "BV1xx411c7mD";

const data: VideoMetadata = {
  aid: 2,
  bvid,
  coverUrl: "https://example.com/cover.jpg",
  description: "",
  episodes: [
    { displayTitle: "第一P（更名）", duration: 60, page: 1, title: "第一P" },
    { displayTitle: "第二P（更名）", duration: 125, page: 2, title: "第二P" },
  ],
  owner: { avatarUrl: "", id: 1, name: "测试UP" },
  publishedAt: 0,
  title: "测试视频",
};

// 长按的分 P 固定取第 2 P；与任何「当前播放曲目」无关
const episode: VideoEpisode = data.episodes[1];

interface MenuItemStub {
  action: () => unknown;
  disabled?: boolean;
  text: string;
}

const onClose = jest.fn();
const globalScope = globalThis as unknown as { window?: unknown };
let originalWindow: unknown;
let openWindow: jest.Mock;

let mountedRenderer: TestRenderer.ReactTestRenderer | undefined;

async function renderMenu() {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<DiscoveryEpisodeMenu data={data} episode={episode} onClose={onClose} />);
    mountedRenderer = renderer;
  });
  return renderer;
}

function isHost(node: TestRenderer.ReactTestInstance, type: string) {
  return typeof node.type === "string" && node.type === type;
}

function readMenuItems(renderer: TestRenderer.ReactTestRenderer): MenuItemStub[] {
  const menu = renderer.root.find(node => isHost(node, "mock-action-menu"));
  return menu.props.menuItems as MenuItemStub[];
}

async function invokeAction(renderer: TestRenderer.ReactTestRenderer, index: number) {
  const item = readMenuItems(renderer)[index];
  await act(async () => {
    await item.action();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
  jest.mocked(useCacheExists).mockReturnValue(true);
  jest.mocked(getResourcePolicy).mockReturnValue({ filterResourceURL: false, useLegacyID: false });
  originalWindow = globalScope.window;
  openWindow = jest.fn();
  globalScope.window = { open: openWindow };
});

afterEach(async () => {
  await act(async () => mountedRenderer?.unmount());
  mountedRenderer = undefined;
  globalScope.window = originalWindow;
});

it("已缓存分 P 可保存：目标取长按分 P 的 bvid/page/title，而不是当前曲目", async () => {
  const renderer = await renderMenu();
  const items = readMenuItems(renderer);

  // 菜单组成：只有 [保存到文件, 添加到歌单, 取消]；不含任何「删除」项
  expect(items.map(item => item.text)).toEqual(["保存到文件", "添加到歌单", "取消"]);
  expect(items.some(item => item.text.includes("删除"))).toBe(false);
  expect(deleteCurrentTrackCache).not.toHaveBeenCalled();

  await invokeAction(renderer, 0);

  // 保存目标 = 第 2 P（长按项），不是缓存目录里的其它文件、也不是临时文件
  expect(getCacheAudioPath).toHaveBeenCalledWith("BV1xx411c7mD", 2, false);
  expect(uriToPath).toHaveBeenCalledWith("file:///offline/BV1xx411c7mD_2.m4a");
  expect(saveAudioFile).toHaveBeenCalledWith("/offline/BV1xx411c7mD_2.m4a", "[BV1xx411c7mD] [P2] 第二P.m4a");
  // 先关单、后导出
  expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(saveAudioFile).mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
  );
  // 不误报「已保存」：底层不回报确认，只说操作已结束
  expect(notify).toHaveBeenCalledWith("保存或分享操作已结束");
  const notified = jest.mocked(notify).mock.calls.map(([message]) => message);
  expect(notified.some(message => message.includes("已保存"))).toBe(false);
});

it("useLegacyID 开启时文件名使用 av 号（bv2av）", async () => {
  jest.mocked(getResourcePolicy).mockReturnValue({ filterResourceURL: false, useLegacyID: true });

  const renderer = await renderMenu();
  await invokeAction(renderer, 0);

  expect(saveAudioFile).toHaveBeenCalledWith(expect.any(String), "[av2] [P2] 第二P.m4a");
  // 独立换算向量：BV1xx411c7mD ↔ av2
  expect(bv2av("BV1xx411c7mD")).toBe(2n);
});

it("保存失败时展示真实错误，而不是成功提示", async () => {
  jest.mocked(saveAudioFile).mockRejectedValueOnce(new Error("分享面板不可用"));

  const renderer = await renderMenu();
  await invokeAction(renderer, 0);

  expect(notify).toHaveBeenCalledWith("文件未保存：分享面板不可用", true);
  expect(notify).not.toHaveBeenCalledWith("保存或分享操作已结束");
  expect(log.error).toHaveBeenCalled();
});

it("web 仍保留下载入口，且没有本地保存项", async () => {
  Platform.OS = "web";

  const renderer = await renderMenu();
  const items = readMenuItems(renderer);

  expect(items.map(item => item.text)).toEqual(["下载", "添加到歌单", "取消"]);
  expect(items.some(item => item.text.includes("保存到文件"))).toBe(false);
  expect(items.some(item => item.text.includes("缓存到本地"))).toBe(false);

  await invokeAction(renderer, 0);

  expect(openWindow).toHaveBeenCalledWith("https://example.com/download");
  expect(getCacheAudioPath).not.toHaveBeenCalled();
  expect(saveAudioFile).not.toHaveBeenCalled();
});

it("native 未缓存时不显示保存到文件（只显示缓存到本地）", async () => {
  jest.mocked(useCacheExists).mockReturnValue(false);

  const renderer = await renderMenu();
  const items = readMenuItems(renderer);

  expect(items.map(item => item.text)).toEqual(["缓存到本地", "添加到歌单", "取消"]);
  expect(items.some(item => item.text.includes("保存到文件"))).toBe(false);
});
