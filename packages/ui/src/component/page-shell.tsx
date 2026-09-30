import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { Text as ReactNativeText } from "react-native";
import { AccessibilityInfo, findNodeHandle, InteractionManager, Platform, ScrollView } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";
import { isWeb, View } from "@tamagui/core";

import { Button } from "./button";
import { Text } from "./text";

const HEADER_HEIGHT = 64;
const DEFAULT_MAX_WIDTH = 1280;
const NO_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export interface PageShellProps {
  /** Plain-text page title, exposed as a heading and focused for screen readers on native. */
  title: string;
  children: ReactNode;
  /** Shows the header back button; the caller decides what going back means. */
  onBack?: () => void;
  /** Header trailing content, e.g. a row of icon buttons. */
  actions?: ReactNode;
  /**
   * Wraps children in a vertical ScrollView (default). Pass `false` for screens
   * that own their scrolling (FlatList, split views).
   */
  scroll?: boolean;
  /**
   * Safe-area insets measured by the host, like `DualScrollView`. The package
   * never reads the safe-area context itself, so plain hosts and DOM providers
   * keep working. Only `top`/`left`/`right` are applied: the bottom inset
   * belongs to whatever the host stacks below the page (app-shell tab bar,
   * player panel), and applying it here would double-pad.
   */
  edgeInsets?: EdgeInsets;
  /** Width cap for the centered header/content column; full width below it. */
  maxWidth?: number;
}

/**
 * De-businessed page layout ported from `apps/mobile` `Layout`: safe-area
 * padding, 64px header with optional back button/actions, and a centered
 * max-width content column.
 *
 * No router and no app-shell pieces live here — the host passes `onBack` and
 * renders its own close-sheet hosts around the shell.
 */
export function PageShell({
  title,
  children,
  onBack,
  actions,
  scroll = true,
  edgeInsets = NO_INSETS,
  maxWidth = DEFAULT_MAX_WIDTH,
}: PageShellProps) {
  const titleRef = useRef<ReactNativeText>(null);

  // Legacy `Layout` behavior: move screen-reader focus to the new page title
  // once the navigation transition settles.
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    let active = true;
    let interaction: { cancel?: () => void } | undefined;
    const timeout = setTimeout(() => {
      interaction = InteractionManager.runAfterInteractions(() => {
        if (!active) {
          return;
        }

        const node = findNodeHandle(titleRef.current);
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }
      });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
      interaction?.cancel?.();
    };
  }, [title]);

  return (
    <View flex={1} alignItems="center">
      <View
        width="100%"
        alignItems="center"
        paddingTop={edgeInsets.top}
        paddingLeft={edgeInsets.left}
        paddingRight={edgeInsets.right}
      >
        <View
          alignItems="center"
          flexDirection="row"
          height={HEADER_HEIGHT}
          justifyContent="center"
          maxWidth={maxWidth}
          width="100%"
        >
          {onBack ? (
            <View
              alignItems="center"
              bottom={0}
              flexDirection="row"
              left={0}
              paddingHorizontal={10}
              position="absolute"
              top={0}
            >
              <Button
                aria-label="返回"
                color="primary"
                icon="fa6-solid:arrow-left"
                onPress={onBack}
                shape="rounded"
                size="lg"
                variant="ghost"
              />
            </View>
          ) : null}
          <Text
            ref={titleRef}
            aria-label={title}
            color="$text"
            numberOfLines={1}
            role="heading"
            semiBold
            size="lg"
            textAlign="center"
            {...(isWeb ? ({ "aria-level": 1 } as object) : null)}
          >
            {title}
          </Text>
          {actions ? (
            <View
              alignItems="center"
              bottom={0}
              flexDirection="row"
              gap="$1"
              paddingHorizontal={10}
              position="absolute"
              right={0}
              top={0}
            >
              {actions}
            </View>
          ) : null}
        </View>
      </View>
      <View flex={1} maxWidth={maxWidth} paddingLeft={edgeInsets.left} paddingRight={edgeInsets.right} width="100%">
        {scroll ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
