import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Triggers an action using Bilisound's semantic variants and control sizes.",
      },
    },
  },
  decorators: [Story => <View alignItems="flex-start"><Story /></View>],
  args: {
    children: "Play",
    onPress: fn(),
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "link"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Sizes: Story = {
  render: args => (
    <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </View>
  ),
};
