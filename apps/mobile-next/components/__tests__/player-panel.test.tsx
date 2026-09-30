/**
 * player-panel 回归测试：只覆盖本次修复的行为，mock 面保持最小。
 *
 * 1. 队列行以 canonicalIndex（而非 track id）区分重复曲目：高亮与点击目标都按索引
 * 2. 进度拖动期间只更新 UI，onSlideEnd 才 seek；键盘/无障碍微调（无 slide 事件）直接 seek
 * 3. 下载被跳过/取消（isCacheExists 为假）时不误报「缓存已就绪」
 * 4. 队列行与迷你栏按钮 numberOfLines={1}，Sheet 带 disableDrag
 */
import TestRenderer, { act } from "react-test-renderer";

import { downloadResourceNow, isCacheExists } from "~/features/cache";
import { jump, seek, toggle } from "~/features/player";

import { notify } from "../feedback";
import { PlayerPanel } from "../player-panel";

// 冷启动：RN 组件与内部实现（FlatList → VirtualizedList → ScrollView/Animated 等）
// 是惰性加载的，冷环境下首次真实挂载要在用例内现做 babel 转换 + require。
// 该一次性成本统一放进 beforeAll 预热（见下），单个用例保持 jest 默认超时。

type TrackFixture = {
  title: string;
  uri: string;
  artist: string;
  artworkUri: string;
  extendedData: { id: string; episode: number; artworkUrl: string };
};

const mockPlaybackState = {
  current: undefined as TrackFixture | undefined,
  queue: [] as TrackFixture[],
  order: [] as number[],
  index: 0,
};

const baseTrack: TrackFixture = {
  artist: "测试作者",
  artworkUri: "https://example.com/cover.jpg",
  extendedData: { artworkUrl: "https://example.com/cover.jpg", episode: 1, id: "BV1TEST" },
  title: "测试曲目",
  uri: "https://example.com/audio.m4a",
};

jest.mock("~/features/player", () => ({
  RepeatMode: { ALL: 2, OFF: 0, ONE: 1 },
  ShuffleMode: { OFF: 0, ON: 1 },
  getCurrentTrackIndex: jest.fn(async () => mockPlaybackState.index),
  jump: jest.fn(async () => {}),
  prev: jest.fn(async () => {}),
  seek: jest.fn(async () => {}),
  setRepeatMode: jest.fn(async () => {}),
  toggle: jest.fn(async () => {}),
  useCurrentTrack: () => mockPlaybackState.current,
  useEvents: () => {},
  useIsPlaying: () => false,
  usePlaybackOrder: () => mockPlaybackState.order,
  useQueue: () => mockPlaybackState.queue,
  useRepeatMode: () => 0,
  useShuffleMode: () => 0,
}));

jest.mock("~/features/playback", () => ({
  deleteCurrentTrackCache: jest.fn(async () => {}),
  playNextTrack: jest.fn(async () => {}),
  toggleShuffleMode: jest.fn(async () => "shuffle"),
  usePlaybackSpeed: () => ({ applySpeed: jest.fn(), retainPitch: false, speedValue: 1 }),
  usePlaylistRestoreLoopOnceFlag: () => [false, jest.fn()],
}));

jest.mock("~/features/cache", () => ({
  downloadResourceNow: jest.fn(async () => {}),
  getCacheAudioPath: jest.fn(() => "/tmp/test-audio.m4a"),
  isCacheExists: jest.fn(() => false),
  useCacheExists: () => false,
  useDownloadList: () => ({ cancel: jest.fn(), cancelAll: jest.fn(), downloadList: new Map() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("expo-router", () => ({ router: { push: jest.fn() }, usePathname: () => "/" }));

jest.mock("~/features/bilibili", () => ({ getDownloadUrl: jest.fn(() => "https://example.com/download") }));
jest.mock("~/features/config", () => ({ getResourcePolicy: () => ({ useLegacyID: false }) }));
jest.mock("~/features/playlist", () => ({ openAddPlaylistPage: jest.fn() }));
jest.mock("~/hooks/useProgressSecond", () => ({
  useProgressSecond: () => ({ buffered: 0, duration: 100, position: 10 }),
}));
jest.mock("~/constants/playback", () => ({ PLACEHOLDER_AUDIO: "placeholder://audio" }));
jest.mock("~/utils/file", () => ({ saveAudioFile: jest.fn(async () => {}), uriToPath: (uri: string) => uri }));
jest.mock("../feedback", () => ({ notify: jest.fn(), reportError: jest.fn() }));
jest.mock("../confirm-dialog", () => ({ ConfirmDialog: () => null }));

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual<typeof import("react")>("react");
  const host = (name: string) => (props: Record<string, unknown>) => ReactMock.createElement(name, props as never);
  return { Image: host("expo-image") };
});

jest.mock("@tamagui/sheet", () => {
  const ReactMock = jest.requireActual<typeof import("react")>("react");
  const host = (name: string) => (props: Record<string, unknown>) => ReactMock.createElement(name, props as never);
  const Sheet = host("mock-sheet");
  return {
    Sheet: Object.assign(Sheet, {
      Frame: host("mock-sheet-frame"),
      Handle: host("mock-sheet-handle"),
      Overlay: host("mock-sheet-overlay"),
    }),
  };
});

jest.mock("@bilisound/ui", () => {
  const ReactMock = jest.requireActual<typeof import("react")>("react");
  const host = (name: string) => (props: Record<string, unknown>) => ReactMock.createElement(name, props as never);
  return {
    Button: host("ui-button"),
    Checkbox: host("ui-checkbox"),
    HStack: host("ui-hstack"),
    Slider: host("ui-slider"),
    StateContent: host("ui-state-content"),
    Text: host("ui-text"),
    VStack: host("ui-vstack"),
  };
});

function isHost(node: TestRenderer.ReactTestInstance, type: string) {
  return typeof node.type === "string" && node.type === type;
}

function queueRowButtons(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAll(
    node =>
      isHost(node, "ui-button") &&
      typeof node.props.accessibilityLabel === "string" &&
      node.props.accessibilityLabel.startsWith("播放 "),
  );
}

function hostText(node: TestRenderer.ReactTestInstance) {
  return node.children.filter((child): child is string => typeof child === "string").join("");
}

let mountedRenderer: TestRenderer.ReactTestRenderer | undefined;

async function renderPanel() {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<PlayerPanel wide={false} />);
    mountedRenderer = renderer;
  });
  return renderer;
}

afterEach(async () => {
  await act(async () => mountedRenderer?.unmount());
  mountedRenderer = undefined;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPlaybackState.current = undefined;
  mockPlaybackState.queue = [];
  mockPlaybackState.order = [];
  mockPlaybackState.index = 0;
  jest.mocked(isCacheExists).mockReturnValue(false);
});

/**
 * 一次性预热：跑一次与首个用例同形态的真实挂载。
 *
 * 冷缓存下首测实测 16–24s（并行负载时 31.7s），全部花在首次挂载触发的 RN 惰性模块
 * 转换 + require 上；后续用例只要 30–80ms，说明没有泄漏。这里把该成本显式移到
 * beforeAll（hook 拥有独立超时预算），用例本身不再背冷加载，也就不需要调大单测超时。
 */
beforeAll(async () => {
  mockPlaybackState.current = { ...baseTrack };
  mockPlaybackState.queue = [{ ...baseTrack }, { ...baseTrack }];
  mockPlaybackState.order = [0, 1];
  const warm = await renderPanel();
  await act(async () => warm.unmount());
  mountedRenderer = undefined;
}, 120000);

it("按 canonicalIndex 区分重复 track id 的队列行", async () => {
  const duplicate = { ...baseTrack, title: "重复曲目" };
  mockPlaybackState.current = duplicate;
  mockPlaybackState.queue = [{ ...duplicate }, { ...duplicate }];
  mockPlaybackState.order = [0, 1];
  mockPlaybackState.index = 1;

  const renderer = await renderPanel();

  const rows = queueRowButtons(renderer);
  expect(rows).toHaveLength(2);
  expect(rows[0].props.variant).toBe("ghost");
  expect(rows[1].props.variant).toBe("solid");

  await act(async () => {
    queueRowButtons(renderer)[0].props.onPress();
  });
  expect(jump).toHaveBeenCalledWith(0);
  expect(toggle).not.toHaveBeenCalled();

  await act(async () => {
    queueRowButtons(renderer)[1].props.onPress();
  });
  expect(toggle).toHaveBeenCalledTimes(1);
  expect(jump).toHaveBeenCalledTimes(1);
});

it("进度拖动结束时才 seek，键盘微调直接 seek", async () => {
  mockPlaybackState.current = { ...baseTrack };
  mockPlaybackState.queue = [{ ...baseTrack }];
  mockPlaybackState.order = [0];

  const renderer = await renderPanel();
  const progressSlider = () =>
    renderer.root.find(node => isHost(node, "ui-slider") && node.props.accessibilityLabel === "播放进度");

  await act(async () => {
    progressSlider().props.onSlideStart();
    progressSlider().props.onValueChange([30]);
  });
  expect(seek).not.toHaveBeenCalled();

  await act(async () => {
    progressSlider().props.onSlideEnd(undefined, 30);
  });
  expect(seek).toHaveBeenCalledTimes(1);
  expect(seek).toHaveBeenCalledWith(30);

  await act(async () => {
    progressSlider().props.onValueChange([42]);
  });
  expect(seek).toHaveBeenCalledTimes(2);
  expect(seek).toHaveBeenLastCalledWith(42);
});

it("下载被跳过或取消时不误报缓存成功", async () => {
  mockPlaybackState.current = { ...baseTrack };
  const exists = jest.mocked(isCacheExists);
  exists.mockReturnValue(false);

  const renderer = await renderPanel();
  const cacheButton = () => renderer.root.find(node => isHost(node, "ui-button") && hostText(node) === "缓存到本地");

  await act(async () => {
    cacheButton().props.onPress();
  });
  expect(downloadResourceNow).toHaveBeenCalledWith("BV1TEST", 1, "测试曲目");
  expect(downloadResourceNow).toHaveBeenCalledTimes(1);
  expect(notify).not.toHaveBeenCalledWith("缓存已就绪");

  exists.mockReturnValue(true);
  await act(async () => {
    cacheButton().props.onPress();
  });
  expect(downloadResourceNow).toHaveBeenCalledTimes(2);
  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledWith("缓存已就绪");
});

it("队列行与迷你栏单行截断，Sheet 禁用拖拽", async () => {
  mockPlaybackState.current = { ...baseTrack };
  mockPlaybackState.queue = [{ ...baseTrack }];
  mockPlaybackState.order = [0];

  const renderer = await renderPanel();

  const sheet = renderer.root.find(node => isHost(node, "mock-sheet"));
  expect(sheet.props.disableDrag).toBe(true);

  const expandButton = renderer.root.find(
    node => isHost(node, "ui-button") && node.props.accessibilityLabel === "展开播放器",
  );
  expect(expandButton.props.numberOfLines).toBe(1);

  const rows = queueRowButtons(renderer);
  expect(rows).toHaveLength(1);
  expect(rows[0].props.numberOfLines).toBe(1);
});
