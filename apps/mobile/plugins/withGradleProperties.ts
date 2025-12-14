import { withGradleProperties } from "@expo/config-plugins";
import { ExpoConfig } from "expo/config";

export default function withCustomGradleProperties(config: ExpoConfig) {
  return withGradleProperties(config, gradlePropertiesConfig => {
    const properties = gradlePropertiesConfig.modResults;

    // 查找并更新 org.gradle.jvmargs
    const jvmargsIndex = properties.findIndex(item => item.type === "property" && item.key === "org.gradle.jvmargs");

    const newJvmargs = "-Xmx4096m -XX:MaxMetaspaceSize=1024m";

    if (jvmargsIndex !== -1) {
      properties[jvmargsIndex] = {
        type: "property",
        key: "org.gradle.jvmargs",
        value: newJvmargs,
      };
    } else {
      properties.push({
        type: "property",
        key: "org.gradle.jvmargs",
        value: newJvmargs,
      });
    }

    return gradlePropertiesConfig;
  });
}
