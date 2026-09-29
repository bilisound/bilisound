import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { fn } from "storybook/test";
import { View } from "@tamagui/core";

import { StateContent } from "./state-content";

const meta = {
  title: "Components/StateContent",
  component: StateContent,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Centered placeholder for empty / error / loading page states. The caller owns the copy and the retry policy; retry only renders once loading has finished.",
      },
    },
  },
  args: {
    title: "还没有创建歌单",
    description: "在 B 站复制视频链接后，到查询页把音视频加入歌单。",
  },
  decorators: [
    Story => (
      <View borderColor="$border" borderRadius="$3" borderWidth={1} height={320} overflow="hidden">
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof StateContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Loading: Story = {
  args: {
    title: "加载中",
    description: undefined,
    loading: true,
  },
};

export const WithRetry: Story = {
  args: {
    title: "加载失败",
    description: "网络异常，请稍后重试。",
    onRetry: fn(),
  },
};

export const TitleOnly: Story = {
  args: {
    title: "这里还没有内容",
    description: undefined,
  },
};
