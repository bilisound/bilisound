import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { fn } from "storybook/test";
import { View } from "@tamagui/core";

import { Button } from "./button";
import { PageShell } from "./page-shell";
import type { PageShellProps } from "./page-shell";
import { Text } from "./text";

function ShellContent() {
  return (
    <View gap="$2" padding="$4">
      {["本地音频", "稍后再看", "下载队列", "收藏的视频", "历史播放", "导入的分享链接"].map(item => (
        <View
          key={item}
          backgroundColor="$surfaceMuted"
          borderColor="$border"
          borderRadius="$2"
          borderWidth={1}
          padding="$3"
        >
          <Text color="$text">{item}</Text>
        </View>
      ))}
    </View>
  );
}

function renderPageShell({ children, ...props }: PageShellProps) {
  return (
    <View borderColor="$border" borderRadius="$3" borderWidth={1} height={420} overflow="hidden">
      <PageShell {...props}>{children}</PageShell>
    </View>
  );
}

const meta = {
  title: "Components/PageShell",
  component: PageShell,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "De-businessed page layout ported from apps/mobile Layout: host-measured safe-area padding, a 64px header with optional back button and actions, and a centered max-width content column. No router or app-shell dependencies; the bottom inset is intentionally not applied so an app-shell tab bar never double-pads.",
      },
    },
  },
  args: {
    title: "播放列表",
    children: <ShellContent />,
  },
  render: renderPageShell,
} satisfies Meta<typeof PageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBackAndActions: Story = {
  args: {
    onBack: fn(),
    actions: <Button aria-label="新建歌单" icon="fa6-solid:plus" shape="rounded" variant="ghost" />,
  },
};

export const SafeAreaInsets: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Insets come from the host. Top/left/right pad the header and content column; the bottom inset is ignored on purpose.",
      },
    },
  },
  args: {
    edgeInsets: { top: 32, bottom: 24, left: 24, right: 24 },
  },
};

export const NonScrolling: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`scroll={false}` hands the scroll container to the caller, for screens that render their own list or split view.",
      },
    },
  },
  args: {
    scroll: false,
  },
};
