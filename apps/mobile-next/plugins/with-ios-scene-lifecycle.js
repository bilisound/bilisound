const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

// iOS 27 asserts at launch (`_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`) unless the app
// adopts the scene life cycle. expo >= 57.0.26 ships `ExpoAppSceneDelegate`, but the SDK 57 prebuild template
// still generates a window-based AppDelegate, so wire the scene delegate in here. Remove once the template does it.

const WINDOW_START_BLOCK =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

function withSceneAppDelegate(config) {
  return withAppDelegate(config, config => {
    if (config.modResults.language !== "swift") {
      throw new Error("with-ios-scene-lifecycle only supports a Swift AppDelegate");
    }
    let contents = config.modResults.contents;
    if (!contents.includes("ExpoReactNativeFactoryProvider")) {
      const declaration = "class AppDelegate: ExpoAppDelegate {";
      if (!contents.includes(declaration) || !WINDOW_START_BLOCK.test(contents)) {
        throw new Error("with-ios-scene-lifecycle: AppDelegate template changed; update the plugin");
      }
      contents = contents
        .replace(declaration, "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {")
        // ExpoAppSceneDelegate creates the window from the connecting scene and starts React Native in it.
        .replace(WINDOW_START_BLOCK, "");
    }
    config.modResults.contents = contents;
    return config;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, config => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "EXExpoAppSceneDelegate",
          },
        ],
      },
    };
    return config;
  });
}

module.exports = config => withSceneManifest(withSceneAppDelegate(config));
