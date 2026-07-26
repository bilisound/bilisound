import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import { TextArea } from "./text-area";

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Multiline text entry with a fixed row count and no browser resize handle.",
      },
    },
  },
  args: {
    onChangeText: fn(),
    placeholder: "Write a comment",
    rows: 3,
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    Story => (
      <View width={360}>
        <Story />
      </View>
    ),
  ],
};

export const Invalid: Story = {
  args: {
    invalid: true,
    placeholder: "A comment is required",
  },
  decorators: [
    Story => (
      <View width={360}>
        <Story />
      </View>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Comments are disabled",
  },
  decorators: [
    Story => (
      <View width={360}>
        <Story />
      </View>
    ),
  ],
};
