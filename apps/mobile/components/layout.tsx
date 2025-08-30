import React, { PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LayoutButton } from "~/components/layout-button";
import { MainBottomSheetCloseHost } from "~/components/main-bottom-sheet/utils";

export interface LayoutProps {
  leftAccessories?: ReactNode | "BACK_BUTTON";
  rightAccessories?: ReactNode;
  title?: string | ReactNode;
  edgeInsets?: EdgeInsets;
  disableContentPadding?: boolean;
}

export function Layout({
  children,
  leftAccessories,
  rightAccessories,
  title,
  edgeInsets,
  disableContentPadding,
}: PropsWithChildren<LayoutProps>) {
  let resultEdgeInsets = useSafeAreaInsets();
  if (edgeInsets) {
    resultEdgeInsets = edgeInsets;
  }
  return (
    <View className={"flex-1 items-center relative"}>
      <View
        style={{
          paddingTop: resultEdgeInsets.top,
          paddingLeft: resultEdgeInsets.left,
          paddingRight: resultEdgeInsets.right,
        }}
        className={"w-full items-center"}
      >
        <View className={"h-16 relative items-center justify-center w-full max-w-screen-xl"}>
          {leftAccessories ? (
            <View className={"absolute left-0 top-0 h-full flex-row items-center px-2.5 gap-1"}>
              {leftAccessories === "BACK_BUTTON" ? (
                <LayoutButton
                  iconName={"fa6-solid:arrow-left"}
                  aria-label={"返回"}
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.navigate("/");
                    }
                  }}
                />
              ) : (
                leftAccessories
              )}
            </View>
          ) : null}
          <View>
            {typeof title === "string" ? <Text className={"text-center font-semibold"}>{title}</Text> : title}
          </View>
          {rightAccessories ? (
            <View className={"absolute right-0 top-0 h-full flex-row items-center px-2.5 gap-1"}>
              {rightAccessories}
            </View>
          ) : null}
        </View>
      </View>
      <View
        className={"w-full flex-1 max-w-screen-xl"}
        style={
          disableContentPadding
            ? {}
            : {
                paddingLeft: resultEdgeInsets.left,
                paddingRight: resultEdgeInsets.right,
                paddingBottom: resultEdgeInsets.bottom,
              }
        }
      >
        <View className={"flex-1"}>{children}</View>
      </View>
      <MainBottomSheetCloseHost />
    </View>
  );
}

export * from "./layout-button";
