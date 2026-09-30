import type { ComponentProps } from "react";
import { PageShell } from "@bilisound/ui";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AppLayout({
  back = false,
  ...props
}: Omit<ComponentProps<typeof PageShell>, "edgeInsets" | "onBack"> & { back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <PageShell
      {...props}
      edgeInsets={insets}
      onBack={back ? () => (router.canGoBack() ? router.back() : router.replace("/")) : undefined}
    />
  );
}
