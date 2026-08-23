import type { EdgeInsets } from "react-native-safe-area-context";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView } from "react-native";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";

import { DualScrollView } from "./dual-scroll-view";
import type { DualScrollViewProps } from "./dual-scroll-view";
import { Heading } from "./heading";
import { Text } from "./text";

const zeroInsets: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

const meta = {
  title: "Components/DualScrollView",
  component: DualScrollView,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Responsive two-column scrolling skeleton ported from apps/mobile. Below gtSm (661px) only the list column renders; from gtSm up the header occupies its own scrollable left column. Resize the story canvas to see the breakpoint switch.",
      },
    },
  },
} satisfies Meta<typeof DualScrollView>;

export default meta;
type Story = StoryObj<typeof meta>;

function HeaderContent() {
  return (
    <View gap="$3">
      <Heading size="xl">Header column</Heading>
      <Text>
        This static content scrolls independently and is only mounted on wide viewports (gtSm, minWidth 661px). Narrow
        viewports collapse to the list column alone.
      </Text>
    </View>
  );
}

function ListColumn() {
  return Array.from({ length: 8 }, (_, index) => (
    <View
      key={index}
      backgroundColor="$surfaceMuted"
      borderWidth={1}
      borderColor="$border"
      borderRadius="$md"
      padding="$3"
      marginBottom="$3"
    >
      <Text color="$text">{`List item ${index + 1}`}</Text>
    </View>
  ));
}

function ListPane({ contentContainerStyle }: { contentContainerStyle: StyleProp<ViewStyle> }) {
  return (
    <ScrollView contentContainerStyle={[contentContainerStyle, { paddingHorizontal: 16 }]}>
      <ListColumn />
    </ScrollView>
  );
}

function renderDualScrollView({ edgeInsets, header, headerContainerStyle, list }: DualScrollViewProps) {
  return (
    <View height={480} borderWidth={1} borderColor="$border">
      <DualScrollView edgeInsets={edgeInsets} header={header} headerContainerStyle={headerContainerStyle} list={list} />
    </View>
  );
}

export const Default: Story = {
  args: {
    edgeInsets: zeroInsets,
    header: <HeaderContent />,
    list: ListPane,
  },
  render: renderDualScrollView,
};

export const HeaderContainerStyle: Story = {
  args: {
    edgeInsets: zeroInsets,
    headerContainerStyle: { maxWidth: 420 },
    header: <HeaderContent />,
    list: ListPane,
  },
  render: renderDualScrollView,
};

export const SafeAreaInsets: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Insets are applied by the host: left inset pads the header scroll view, right inset pads the list column, bottom inset pads both content containers.",
      },
    },
  },
  args: {
    edgeInsets: { top: 0, bottom: 24, left: 32, right: 48 },
    header: <HeaderContent />,
    list: ListPane,
  },
  render: renderDualScrollView,
};
