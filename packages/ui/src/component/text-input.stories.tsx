import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import { TextInput } from "./text-input";

const meta = {
  title: "Components/TextInput",
  component: TextInput,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Single-line text entry with Bilisound sizing, validation, and disabled states.",
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
    onChangeText: fn(),
    placeholder: "Paste a Bilibili URL",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  args: {
    invalid: true,
    placeholder: "Invalid input",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Disabled value",
  },
};

export const Sizes: Story = {
  render: args => (
    <View gap="$3" width={320}>
      <TextInput {...args} size="sm" placeholder="Small" />
      <TextInput {...args} size="md" placeholder="Medium" />
      <TextInput {...args} size="lg" placeholder="Large" />
    </View>
  ),
};
