import { EdgeInsets } from "react-native-safe-area-context";
import { ScrollView, View, ViewStyle } from "react-native";
import { ContentStyle } from "@shopify/flash-list";
import React from "react";

export interface DualScrollViewProps {
  edgeInsets: EdgeInsets;
  header: React.ReactNode;
  headerContainerStyle?: ViewStyle;
  list: (props: { contentContainerStyle: ContentStyle }) => React.ReactNode;
}

export function DualScrollView({ edgeInsets, header, list, headerContainerStyle }: DualScrollViewProps) {
  return (
    <View className={"flex-1 flex-row"}>
      <ScrollView
        scrollIndicatorInsets={{
          bottom: Number.MIN_VALUE,
        }}
        className={"hidden sm:flex flex-1"}
        style={{
          paddingLeft: edgeInsets.left,
        }}
      >
        <View
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: edgeInsets.bottom + 16,
            ...headerContainerStyle,
          }}
        >
          {header}
        </View>
      </ScrollView>
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
