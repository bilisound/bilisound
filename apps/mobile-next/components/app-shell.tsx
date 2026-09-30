import type { ReactNode } from "react";
import { Button, HStack, Text, VStack } from "@bilisound/ui";
import { isWeb } from "@tamagui/core";
import { router, usePathname } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlayerPanel } from "./player-panel";

const tabs = [
  { href: "/playlist" as const, label: "歌单" },
  { href: "/" as const, label: "查询" },
  { href: "/settings" as const, label: "设置" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const wide = useWindowDimensions().width >= 768;
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const navigation = tabs.map(tab => {
    const selected = pathname === tab.href;
    return (
      <Button
        key={tab.href}
        variant={selected ? "solid" : "ghost"}
        accessibilityLabel={tab.label}
        // This is navigation, not a tab widget: `role="tab"` + `aria-selected` would
        // dangle without a tablist. The current item is exposed through
        // `aria-current="page"`; native keeps its existing selected state.
        {...(isWeb
          ? ({ "aria-current": selected ? "page" : undefined } as object)
          : { accessibilityState: { selected } })}
        onPress={() => router.navigate(tab.href)}
        flex={wide ? undefined : 1}
      >
        {tab.label}
      </Button>
    );
  });
  return (
    <HStack flex={1} backgroundColor="$canvas">
      {wide ? (
        <VStack
          width={156}
          padding="$3"
          paddingTop={insets.top + 24}
          gap="$3"
          borderRightWidth={1}
          borderColor="$border"
        >
          <Text semiBold>Bilisound Next</Text>
          {navigation}
        </VStack>
      ) : null}
      <VStack flex={1} minWidth={0}>
        {children}
        {!wide ? <PlayerPanel wide={false} /> : null}
        {!wide ? (
          <HStack
            padding="$2"
            paddingBottom={Math.max(insets.bottom, 8)}
            gap="$1"
            borderTopWidth={1}
            borderColor="$border"
          >
            {navigation}
          </HStack>
        ) : null}
      </VStack>
      {wide ? <PlayerPanel wide /> : null}
    </HStack>
  );
}
