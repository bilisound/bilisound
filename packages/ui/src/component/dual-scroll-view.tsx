import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView } from "react-native";
import { styled, View } from "@tamagui/core";
import type { EdgeInsets } from "react-native-safe-area-context";

/**
 * Left header pane: hidden on narrow viewports, becomes the flexible first
 * column from `gtSm` (661px) up. Mirrors the legacy `hidden sm:flex flex-1`.
 */
const HeaderPane = styled(View, {
  name: "BilisoundDualScrollViewHeaderPane",
  display: "none",
  $gtSm: {
    display: "flex",
    flex: 1,
  },
});

export interface DualScrollViewProps {
  /**
   * Safe-area insets measured by the host application. The package does not
   * read `react-native-safe-area-context` hooks itself so it stays usable
   * inside plain hosts and DOM providers.
   */
  edgeInsets: EdgeInsets;
  /** Static left column content, rendered inside its own ScrollView from `gtSm`. */
  header: ReactNode;
  /** Extra style merged into the header pane's content container. */
  headerContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Renders the right-hand scrolling column. Receives the computed
   * `contentContainerStyle` so the caller can spread it onto its own
   * ScrollView / FlatList.
   */
  list: (props: { contentContainerStyle: StyleProp<ViewStyle> }) => ReactNode;
}

/**
 * Responsive two-column scrolling skeleton ported from
 * apps/mobile/components/dual-scroll-view.tsx.
 *
 * Below `gtSm` only `list` renders (single column). From `gtSm` up, `header`
 * occupies a fixed-free flexible left column with its own scroll view, and the
 * list column takes the remaining space. Pure layout: no routing, no business
 * policy.
 */
export function DualScrollView({ edgeInsets, header, headerContainerStyle, list }: DualScrollViewProps) {
  return (
    <View flex={1} flexDirection="row">
      <HeaderPane>
        <ScrollView
          scrollIndicatorInsets={{
            bottom: Number.MIN_VALUE,
          }}
          style={{
            paddingLeft: edgeInsets.left,
          }}
        >
          <View paddingLeft={16} paddingRight={16} paddingBottom={edgeInsets.bottom + 16} style={headerContainerStyle}>
            {header}
          </View>
        </ScrollView>
      </HeaderPane>
      {list({
        contentContainerStyle: {
          paddingLeft: 0,
          paddingRight: edgeInsets.right,
          paddingBottom: edgeInsets.bottom,
        },
      })}
    </View>
  );
}
