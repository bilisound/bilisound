import type { ExpoConfig } from "expo/config";
import packageJson from "./package.json";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl || !URL.canParse(apiUrl) || !["http:", "https:"].includes(new URL(apiUrl).protocol)) {
  throw new Error(
    "EXPO_PUBLIC_API_URL must be an absolute HTTP(S) API URL. Copy .env.example to .env.local and configure server-cf before building.",
  );
}

const config: ExpoConfig = {
  name: "Bilisound Next Dev",
  slug: "bilisound-mobile-next",
  version: packageJson.version,
  scheme: "bilisound-next",
  icon: "./assets/images/icon-dev.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "moe.bilisound.app.next.dev",
    supportsTablet: true,
    infoPlist: { UIBackgroundModes: ["audio"] },
  },
  android: {
    package: "moe.bilisound.app.next.dev",
    adaptiveIcon: { foregroundImage: "./assets/images/adaptive-icon-dev.png", backgroundColor: "#e79797" },
    permissions: ["android.permission.MODIFY_AUDIO_SETTINGS"],
  },
  web: { bundler: "metro", favicon: "./assets/images/favicon.png" },
  plugins: [
    "../../packages/ui/plugins/withAndroidTheme",
    "./plugins/with-ios-scene-lifecycle",
    "./plugins/with-android-kotlin-jvm-target",
    ["react-native-edge-to-edge", { android: { enforceNavigationBarContrast: false } }],
    ["expo-splash-screen", { image: "./assets/images/icon-dev.png", imageWidth: 200, backgroundColor: "#ffffff" }],
    "expo-router",
    ["expo-camera", { cameraPermission: "Bilisound 需要通过摄像头扫描二维码", recordAudioAndroid: false }],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: "36.0.0",
          usesCleartextTraffic: true,
        },
        ios: { deploymentTarget: "17.0" },
      },
    ],
    "expo-font",
    "expo-asset",
    "expo-sqlite",
    "expo-image",
    "expo-sharing",
  ],
  experiments: { typedRoutes: true },
  extra: { router: { origin: false } },
};

export default config;
