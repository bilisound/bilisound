import "~/utils/polyfill";
import { useEffect, useState } from "react";
import { Stack } from "expo-router/stack";
import { SplashScreen } from "expo-router";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BilisoundProvider, StateContent, updateUserTheme } from "@bilisound/ui";
import { StatusBar } from "expo-status-bar";
import { useAppearanceConfig } from "~/features/config";
import { registerPlaybackBackgroundEvents } from "~/features/playback";
import { findUserTheme, useThemeRegistry } from "~/features/theme/registry";
import init from "~/utils/init";
import { AppShell } from "~/components/app-shell";
import { FeedbackHost } from "~/components/feedback";

export { ErrorBoundary } from "expo-router";

const queryClient = new QueryClient();
let initialization: Promise<unknown> | undefined;

function App() {
  const appearance = useColorScheme() === "dark" ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { theme } = useAppearanceConfig();
  const themes = useThemeRegistry(state => state.themes);
  const userTheme = findUserTheme(themes, theme);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    initialization ??= (async () => {
      await init();
      await useThemeRegistry.getState().loadThemes();
      registerPlaybackBackgroundEvents();
    })().catch(cause => { initialization = undefined; throw cause; });
    initialization.then(() => { if (active) setReady(true); }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : String(cause));
      void SplashScreen.hideAsync();
    });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => { if (userTheme) updateUserTheme(userTheme.palette); }, [userTheme]);

  return (
    <BilisoundProvider appearance={appearance} theme={userTheme ? "user" : theme === "red" ? "red" : "classic"} insets={insets}>
      <StatusBar style={appearance === "dark" ? "light" : "dark"} />
      {ready ? <AppShell><Stack screenOptions={{ headerShown: false }} /><FeedbackHost /></AppShell> :
        <StateContent title={error ? "启动失败" : "正在初始化"} description={error} loading={!error}
          onRetry={error ? () => { setError(undefined); setAttempt(value => value + 1); } : undefined} />}
    </BilisoundProvider>
  );
}

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><QueryClientProvider client={queryClient}><App /></QueryClientProvider></SafeAreaProvider></GestureHandlerRootView>;
}
