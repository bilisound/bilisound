import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";

import { Label, LabelError } from "./label";
import { TextInput } from "./text-input";

const meta = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Identifies a form control and optionally exposes a visible required marker.",
      },
    },
  },
  args: {
    children: "Playlist name",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const WithTextInput: Story = {
  render: args => (
    <View width={320}>
      <Label {...args} htmlFor="playlist-name" required />
      <TextInput id="playlist-name" placeholder="My favorites" />
    </View>
  ),
};

export const Invalid: Story = {
  render: args => (
    <View width={320}>
      <Label {...args} htmlFor="invalid-playlist-name" required />
      <TextInput id="invalid-playlist-name" invalid value="" />
      <LabelError>Playlist name is required</LabelError>
    </View>
  ),
};
