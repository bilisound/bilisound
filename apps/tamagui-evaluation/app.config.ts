import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Tamagui Evaluation",
  slug: "bilisound-tamagui-evaluation",
  version: "0.0.0",
  scheme: "bilisound-tamagui-evaluation",
  userInterfaceStyle: "automatic",
  android: {
    package: "moe.bilisound.tamaguievaluation",
  },
  ios: {
    bundleIdentifier: "moe.bilisound.tamaguievaluation",
  },
  web: {
    bundler: "metro",
  },
};

export default config;
