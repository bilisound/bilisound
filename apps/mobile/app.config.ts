import "tsx/cjs";
import { ExpoConfig } from "expo/config";
import { merge } from "lodash";

import packageJson from "./package.json";
import { BRAND } from "./constants/branding";

type Env = "development" | "production";

const env: Env = process.env.EXPO_PUBLIC_ENV as Env;

const baseConfig: ExpoConfig = {
  name: "Bilisound",
  slug: "bilisound-client-mobile",
  version: packageJson.version,
  icon: "./assets/images/icon.png",
  scheme: "bilisound",
  userInterfaceStyle: "automatic",
  primaryColor: "#00ba9d",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: `${BRAND} 需要通过摄像头扫描二维码`,
      UIBackgroundModes: ["audio"],
    },
    bundleIdentifier: "moe.bilisound.app",
  },
  android: {
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#97E7DC",
    },
    permissions: [
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ],
    package: "moe.bilisound.app",
  },
  web: {
    bundler: "metro",
    // output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "./plugins/withAndroidSignature",
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
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/images/icon.png",
        dark: {
          image: "./assets/images/icon.png",
          backgroundColor: "#171717",
        },
        imageWidth: 200,
      },
    ],
    "expo-router",
    [
      "expo-camera",
      {
        cameraPermission: `${BRAND} 需要通过摄像头扫描二维码`,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          // kotlinVersion: "2.0.0",
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: "36.0.0",
          usesCleartextTraffic: true,
          enableProguardInReleaseBuilds: true,
          gradleProperties: {
            "org.gradle.jvmargs": "-Xmx6g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError",
          },
        },
        ios: {
          deploymentTarget: "17.0",
        },
      },
    ],
    "expo-font",
    "expo-asset",
    "expo-sqlite",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
  },
};

export default (): ExpoConfig => {
  if (!env) {
    throw new Error("Please configure EXPO_PUBLIC_ENV before processing!");
  }
  let dynamicConfig: Partial<ExpoConfig> = {};
  if (env === "development") {
    dynamicConfig = {
      name: "Bilisound Dev",
      icon: "./assets/images/icon-dev.png",
      ios: {
        bundleIdentifier: "moe.bilisound.app.dev",
      },
      android: {
        package: "moe.bilisound.app.dev",
        adaptiveIcon: {
          foregroundImage: "./assets/images/adaptive-icon-dev.png",
          backgroundColor: "#e79797",
        },
      },
    };
  }

  return merge(baseConfig, dynamicConfig);
};
