import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Bilisound UI",
  slug: "bilisound-ui",
  version: "0.0.0",
  orientation: "default",
  userInterfaceStyle: "automatic",
  web: {
    bundler: "metro",
  },
};

export default config;
