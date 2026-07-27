import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Bilisound UI",
  slug: "bilisound-ui",
  version: "0.0.0",
  orientation: "default",
  userInterfaceStyle: "automatic",
  plugins: [
    "./plugins/withAndroidTheme",
    [
      "react-native-edge-to-edge",
      {
        android: {
          enforceNavigationBarContrast: false,
        },
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          usePrecompiledModules: true,
        },
      },
    ],
    "@react-native-community/datetimepicker",
  ],
  ios: {
    bundleIdentifier: "moe.bilisound.ui",
  },
  android: {
    package: "moe.bilisound.ui",
  },
  web: {
    bundler: "metro",
  },
};

export default config;
