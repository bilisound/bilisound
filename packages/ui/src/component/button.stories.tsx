import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { fn } from "storybook/test";

import { Button } from "./button";
import type { ButtonColor, ButtonVariant } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Triggers an action using a color (primary, accent, neutral) decoupled from a variant (solid, outline, ghost, link), plus control sizes, optional icons, and default or rounded shapes.",
      },
    },
  },
  decorators: [
    Story => (
      <View alignItems="flex-start">
        <Story />
      </View>
    ),
  ],
  args: {
    children: "Play",
    onPress: fn(),
  },
  argTypes: {
    color: {
      control: "select",
      options: ["primary", "accent", "neutral"],
    },
    icon: {
      control: "select",
      options: ["fa6-solid:play", "fa6-solid:plus", "fa6-solid:arrow-up-from-bracket"],
    },
    iconPosition: {
      control: "select",
      options: ["start", "end"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: ["solid", "outline", "ghost", "link"],
    },
    shape: {
      control: "select",
      options: ["default", "rounded"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const colors: ButtonColor[] = ["primary", "accent", "neutral"];

export const Solid: Story = {};

export const Outline: Story = {
  args: {
    color: "accent",
    variant: "outline",
  },
};

export const Ghost: Story = {
  args: {
    color: "neutral",
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
  },
};

export const ColorMatrix: Story = {
  render: args => (
    <View gap="$3">
      {(["solid", "outline", "ghost", "link"] as ButtonVariant[]).map(variant => (
        <View key={variant} flexDirection="row" flexWrap="wrap" alignItems="center" gap="$3">
          {colors.map(color => (
            <Button key={color} {...args} color={color} variant={variant}>
              {variant} {color}
            </Button>
          ))}
        </View>
      ))}
    </View>
  ),
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

export const WithIcons: Story = {
  render: args => (
    <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$3">
      <Button {...args} icon="fa6-solid:play">
        Icon first
      </Button>
      <Button {...args} icon="fa6-solid:arrow-up-from-bracket" iconPosition="end">
        Text first
      </Button>
    </View>
  ),
};

export const IconOnly: Story = {
  args: {
    accessibilityLabel: "Play",
    children: undefined,
    icon: "fa6-solid:play",
  },
  render: args => (
    <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$3">
      <Button {...args} size="sm" />
      <Button {...args} size="md" />
      <Button {...args} size="lg" />
    </View>
  ),
};

export const Rounded: Story = {
  args: {
    icon: "fa6-solid:play",
    shape: "rounded",
  },
  render: args => (
    <View flexDirection="row" flexWrap="wrap" alignItems="center" gap="$3">
      <Button {...args} />
      <Button {...args} accessibilityLabel="Play" children={undefined} />
    </View>
  ),
};
