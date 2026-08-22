import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";

import { Text } from "./text";

const meta = {
  title: "Components/Text",
  component: Text,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "General-purpose text with the ported Gluestack typography variants. Defaults to the muted body color.",
      },
    },
  },
  args: {
    children: "Bilibili audio and video, anywhere",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: {
    color: "$text",
  },
};

export const Sizes: Story = {
  render: args => (
    <View gap="$2">
      {(["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"] as const).map(size => (
        <Text key={size} {...args} size={size}>
          size=&quot;{size}&quot; — The quick brown fox jumps over the lazy dog
        </Text>
      ))}
    </View>
  ),
};

export const Emphasis: Story = {
  render: args => (
    <View gap="$2">
      <Text {...args} bold>
        Bold text
      </Text>
      <Text {...args} semiBold>
        Semi-bold text
      </Text>
      <Text {...args} italic>
        Italic text
      </Text>
      <Text {...args} underline>
        Underlined text
      </Text>
      <Text {...args} strikeThrough>
        Struck-through text
      </Text>
      <Text {...args} highlight>
        Highlighted text
      </Text>
    </View>
  ),
};

export const Truncated: Story = {
  render: args => (
    <View width={220}>
      <Text {...args} truncated>
        A very long playlist title that should truncate to a single line with an ellipsis
      </Text>
    </View>
  ),
};
