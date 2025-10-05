// https://github.com/facebook/react-native/issues/52775#issuecomment-3213592571

// https://github.com/expo/expo/issues/19563#issuecomment-1990897138
// 对 res/styles 进行处理，调整主题色和删除多余属性

import { withAndroidStyles } from "@expo/config-plugins";
import { ExpoConfig } from "expo/config";

export default function withCustomAppTheme(config: ExpoConfig) {
  config = withAndroidStyles(config, androidStylesConfig => {
    const styles = androidStylesConfig.modResults;
    styles.resources.style?.map(style => {
      if (style.$.name === "AppTheme") {
        // HyperOS 2 Android 15 TextInput (EditText) 内容不垂直居中问题修复
        style.item.push({
          $: { name: "android:textViewStyle" },
          _: "@style/Widget.App.TextView",
        });
        style.item.push({
          $: { name: "editTextStyle" },
          _: "@style/Widget.App.EditText",
        });
        style.item.push({
          $: { name: "android:editTextStyle" },
          _: "@style/Widget.App.EditText",
        });
      }
    });
    styles.resources.style?.push({
      $: { name: "Widget.App.TextView", parent: "Widget.AppCompat.TextView" },
      item: [
        {
          $: { name: "android:elegantTextHeight" },
          _: "false",
        },
        {
          $: { name: "android:useLocalePreferredLineHeightForMinimum" },
          _: "false",
        },
      ],
    });
    styles.resources.style?.push({
      $: { name: "Widget.App.EditText", parent: "Widget.AppCompat.EditText" },
      item: [
        {
          $: { name: "android:elegantTextHeight" },
          _: "false",
        },
        {
          $: { name: "android:useLocalePreferredLineHeightForMinimum" },
          _: "false",
        },
      ],
    });

    return androidStylesConfig;
  });

  return config;
}
