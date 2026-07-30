import { Stack } from "expo-router/stack";

import { ShowcaseThemeProvider } from "../showcase/showcase-theme";

export default function RootLayout() {
  return (
    <ShowcaseThemeProvider>
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: "Bilisound UI" }} />
        <Stack.Screen name="components" options={{ title: "Components" }} />
        <Stack.Screen name="expo-dom" options={{ title: "Expo DOM" }} />
      </Stack>
    </ShowcaseThemeProvider>
  );
}
