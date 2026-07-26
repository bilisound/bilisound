import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import { Slider } from "./slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Selects one value or a range while retaining Tamagui's keyboard and accessibility behavior.",
      },
    },
  },
  args: {
    accessibilityLabel: "Volume",
    defaultValue: [64],
    max: 100,
    min: 0,
    onValueChange: fn(),
    step: 1,
  },
  decorators: [
    Story => (
      <View width={360}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Range: Story = {
  args: {
    accessibilityLabel: undefined,
    defaultValue: [25, 75],
    thumbLabels: ["Minimum volume", "Maximum volume"],
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
