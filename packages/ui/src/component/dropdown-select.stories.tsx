import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import { DropdownSelect } from "./dropdown-select";
import type { DropdownSelectOption } from "./dropdown-select";

const playbackQualityOptions = [
  { label: "流畅 64K", value: "64k" },
  { label: "标准 132K", value: "132k" },
  { label: "高品质 192K", value: "192k" },
  { disabled: true, label: "无损 FLAC（暂不可用）", value: "flac" },
] as const satisfies readonly DropdownSelectOption[];

const meta = {
  title: "Components/DropdownSelect",
  component: DropdownSelect,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Single-value selection with TextInput-compatible chrome. Below 640px it opens ActionMenu; from 640px it uses an anchored dropdown menu.",
      },
    },
  },
  decorators: [
    Story => (
      <View width={320}>
        <Story />
      </View>
    ),
  ],
  args: {
    defaultValue: "132k",
    onOpenChange: fn(),
    onValueChange: fn(),
    options: playbackQualityOptions,
    placeholder: "选择音质",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof DropdownSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Placeholder: Story = {
  args: {
    defaultValue: undefined,
  },
};

export const Invalid: Story = {
  args: {
    defaultValue: undefined,
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Sizes: Story = {
  render: args => (
    <View gap="$3" width={320}>
      <DropdownSelect {...args} size="sm" />
      <DropdownSelect {...args} size="md" />
      <DropdownSelect {...args} size="lg" />
    </View>
  ),
};
