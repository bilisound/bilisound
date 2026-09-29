import type { ReactNode } from "react";
import { Button, HStack, Text, VStack } from "@bilisound/ui";
import { router, usePathname } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabs = [
  { href: "/playlist" as const, label: "歌单" },
  { href: "/" as const, label: "查询" },
  { href: "/settings" as const, label: "设置" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const wide = useWindowDimensions().width >= 768;
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const navigation = tabs.map(tab => (
    <Button key={tab.href} variant={pathname === tab.href ? "solid" : "ghost"} accessibilityLabel={tab.label}
      accessibilityState={{ selected: pathname === tab.href }} onPress={() => router.navigate(tab.href)} flex={wide ? undefined : 1}>
      {tab.label}
    </Button>
  ));
  return (
    <HStack flex={1} backgroundColor="$canvas">
      {wide ? <VStack width={156} padding="$3" paddingTop={insets.top + 24} gap="$3" borderRightWidth={1} borderColor="$border"><Text semiBold>Bilisound Next</Text>{navigation}</VStack> : null}
      <VStack flex={1} minWidth={0}>
        {children}
        {!wide ? <HStack padding="$2" paddingBottom={Math.max(insets.bottom, 8)} gap="$1" borderTopWidth={1} borderColor="$border">{navigation}</HStack> : null}
      </VStack>
    </HStack>
  );
}
