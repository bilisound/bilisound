import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { Text, View } from "@tamagui/core";
import { fn } from "storybook/test";

import { ActionMenu } from "./action-menu";
import type { ActionMenuProps } from "./action-menu";
import { Button } from "./button";

const menuItems = [
  {
    id: "add",
    text: "添加到歌单",
    icon: "fa6-solid:plus",
    iconSize: 16,
    action: fn(),
  },
  {
    id: "edit",
    text: "编辑信息",
    icon: "fa6-solid:pen",
    iconSize: 16,
    action: fn(),
  },
  {
    id: "download",
    text: "下载",
    icon: "fa6-solid:download",
    action: fn(),
  },
  {
    id: "delete",
    text: "删除",
    icon: "fa6-solid:trash-can",
    disabled: true,
    action: fn(),
  },
  {
    id: "hidden",
    text: "隐藏项目",
    icon: "fa6-solid:eye",
    show: false,
    action: fn(),
  },
  {
    id: "cancel",
    text: "取消",
    icon: "fa6-solid:xmark",
    iconSize: 20,
    action: fn(),
  },
] satisfies ActionMenuProps["menuItems"];

function ActionMenuDemo({ menuItems: items, ...props }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const closeAfterAction = items.map(item => ({
    ...item,
    action: () => {
      item.action();
      setOpen(false);
    },
  }));

  return (
    <View width="100%" minHeight={360} alignItems="flex-start">
      <Button onPress={() => setOpen(true)}>打开操作菜单</Button>
      <ActionMenu {...props} open={open} onOpenChange={setOpen} menuItems={closeAfterAction} />
    </View>
  );
}

const meta = {
  title: "Components/ActionMenu",
  component: ActionMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A responsive action menu presented in a Tamagui Sheet. Items use locally bundled SVGs extracted from Iconify packages.",
      },
    },
  },
  args: {
    menuItems,
  },
  render: args => <ActionMenuDemo {...args} />,
} satisfies Meta<typeof ActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHeader: Story = {
  args: {
    header: (
      <View width="100%" padding="$3" gap="$1">
        <Text color="$text" fontFamily="$body" fontSize="$md" lineHeight="$md" fontWeight="700">
          示例播放列表
        </Text>
        <Text color="$textMuted" fontFamily="$body" fontSize="$sm" lineHeight="$sm">
          12 首歌曲
        </Text>
      </View>
    ),
  },
};
