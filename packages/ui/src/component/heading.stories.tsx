import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";

import { Heading } from "./heading";
import { Text } from "./text";

const meta = {
  title: "Components/Heading",
  component: Heading,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Semantic heading ported from Gluestack. Web renders h1-h6 tags from size (3xl-5xl -> h1, 2xl -> h2, xl -> h3, lg/md -> h4/h5, sm/xs -> h6).",
      },
    },
  },
  args: {
    children: "Playlist settings",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: args => (
    <View gap="$3">
      <Heading {...args} size="5xl">
        H1 · size 5xl
      </Heading>
      <Heading {...args} size="4xl">
        H1 · size 4xl
      </Heading>
      <Heading {...args} size="3xl">
        H1 · size 3xl
      </Heading>
      <Heading {...args} size="2xl">
        H2 · size 2xl
      </Heading>
      <Heading {...args} size="xl">
        H3 · size xl
      </Heading>
      <Heading {...args} size="lg">
        H4 · size lg
      </Heading>
      <Heading {...args} size="md">
        H5 · size md
      </Heading>
      <Heading {...args} size="sm">
        H6 · size sm
      </Heading>
      <Heading {...args} size="xs">
        H6 · size xs
      </Heading>
    </View>
  ),
};

export const MutedAndWeight: Story = {
  render: args => (
    <View gap="$2">
      <Heading {...args} color="$textMuted">
        Muted heading follows textMuted
      </Heading>
      <Text>Body copy under a heading uses the Text component.</Text>
    </View>
  ),
};

export const Truncated: Story = {
  render: args => (
    <View width={240}>
      <Heading {...args} truncated>
        An extremely long video title that must truncate on one line
      </Heading>
    </View>
  ),
};
