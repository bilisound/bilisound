import React, { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
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
    <View style={styles.root}>
      <View
        style={[
          styles.headerOuter,
          {
            paddingTop: resultEdgeInsets.top,
            paddingLeft: resultEdgeInsets.left,
            paddingRight: resultEdgeInsets.right,
          },
        ]}
      >
        <View style={styles.headerInner}>
          {leftAccessories ? (
            <View style={styles.leftAccessories}>
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
          <View>{typeof title === "string" ? <Text style={styles.title}>{title}</Text> : title}</View>
          {rightAccessories ? <View style={styles.rightAccessories}>{rightAccessories}</View> : null}
        </View>
      </View>
      <View
        style={[
          styles.contentOuter,
          disableContentPadding
            ? {}
            : {
                paddingLeft: resultEdgeInsets.left,
                paddingRight: resultEdgeInsets.right,
                paddingBottom: resultEdgeInsets.bottom,
              },
        ]}
      >
        <View style={styles.contentInner}>{children}</View>
      </View>
      <MainBottomSheetCloseHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  headerOuter: {
    width: "100%",
    alignItems: "center",
  },
  headerInner: {
    height: 64,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 1280,
  },
  leftAccessories: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 4,
  },
  title: {
    textAlign: "center",
    fontWeight: "600",
  },
  rightAccessories: {
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 4,
  },
  contentOuter: {
    width: "100%",
    flex: 1,
    maxWidth: 1280,
  },
  contentInner: {
    flex: 1,
  },
});

export * from "./layout-button";
