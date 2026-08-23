import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";

import { Button } from "./button";
import { Text } from "./text";
import { VStack } from "./vstack";

const meta = {
  title: "Components/VStack",
  component: VStack,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Vertical layout primitive ported from Gluestack. `space` applies the 4-point gap scale; `reversed` flips the visual order via column-reverse.",
      },
    },
  },
  argTypes: {
    space: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"],
    },
    reversed: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof VStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    space: "md",
  },
  render: args => (
    <VStack {...args}>
      <Button size="sm">First</Button>
      <Button size="sm">Second</Button>
      <Button size="sm">Third</Button>
    </VStack>
  ),
};

export const Spaces: Story = {
  render: args => (
    <View gap="$4">
      {(["xs", "sm", "md", "lg"] as const).map(space => (
        <View key={space} gap="$1">
          <Text fontSize="$2xs">{`space="${space}"`}</Text>
          <VStack {...args} space={space}>
            <Button size="sm">A</Button>
            <Button size="sm">B</Button>
            <Button size="sm">C</Button>
          </VStack>
        </View>
      ))}
    </View>
  ),
};

export const Reversed: Story = {
  args: {
    space: "md",
    reversed: true,
  },
  render: args => (
    <VStack {...args}>
      <Button size="sm">Tree order 1</Button>
      <Button size="sm">Tree order 2</Button>
      <Button size="sm">Tree order 3</Button>
    </VStack>
  ),
};
