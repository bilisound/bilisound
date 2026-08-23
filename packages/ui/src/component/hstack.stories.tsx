import { Button } from "./button";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";
import { HStack } from "./hstack";
import { Text } from "./text";

const meta = {
  title: "Components/HStack",
  component: HStack,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Horizontal layout primitive ported from Gluestack. `space` applies the 4-point gap scale; `reversed` flips the visual order via row-reverse.",
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
} satisfies Meta<typeof HStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    space: "md",
  },
  render: args => (
    <HStack {...args}>
      <Button size="sm">First</Button>
      <Button size="sm">Second</Button>
      <Button size="sm">Third</Button>
    </HStack>
  ),
};

export const Spaces: Story = {
  render: args => (
    <View gap="$4">
      {(["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const).map(space => (
        <View key={space} gap="$1">
          <Text fontSize="$2xs">{`space="${space}"`}</Text>
          <HStack {...args} space={space}>
            <Button size="sm">A</Button>
            <Button size="sm">B</Button>
            <Button size="sm">C</Button>
          </HStack>
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
    <HStack {...args}>
      <Button size="sm">Tree order 1</Button>
      <Button size="sm">Tree order 2</Button>
      <Button size="sm">Tree order 3</Button>
    </HStack>
  ),
};

export const Alignment: Story = {
  args: {
    space: "md",
    alignItems: "center",
  },
  render: args => (
    <View height={120} backgroundColor="$canvas">
      <HStack {...args}>
        <Button size="sm">Top</Button>
        <Button size="md">Center (alignItems center)</Button>
        <Button size="lg">Bottom</Button>
      </HStack>
    </View>
  ),
};
