import { withGradleProperties, withProjectBuildGradle } from "expo/config-plugins";
import { ExpoConfig } from "expo/config";

export default function withCustomGradleProperties(config: ExpoConfig) {
  config = withGradleProperties(config, gradlePropertiesConfig => {
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

  return withProjectBuildGradle(config, gradleConfig => {
    if (gradleConfig.modResults.language !== "groovy") {
      throw new Error("如果不是 groovy，则无法设置 Android Kotlin JVM target");
    }
    gradleConfig.modResults.contents = setKotlinJvmTarget(gradleConfig.modResults.contents);
    return gradleConfig;
  });
}

function setKotlinJvmTarget(projectBuildGradle: string) {
  const block = `
subprojects { subproject ->
  subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      jvmTarget = "17"
    }
  }
}
`;

  if (projectBuildGradle.includes("jvmTarget = \"17\"")) {
    return projectBuildGradle;
  }

  return `${projectBuildGradle.trimEnd()}\n${block}`;
}
