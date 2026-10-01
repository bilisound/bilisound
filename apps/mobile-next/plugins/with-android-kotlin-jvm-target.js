const { withProjectBuildGradle } = require("expo/config-plugins");

// The build runs on JDK 21, so Kotlin defaults to JVM target 21 while AGP keeps Java at 17. Libraries that set
// neither (e.g. react-native-image-colors on AGP >= 8) then fail Gradle's JVM-target validation, so pin Kotlin to 17.

const MARKER = "JvmTarget.JVM_17";

const BLOCK = `
subprojects { subproject ->
  subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    compilerOptions {
      jvmTarget = org.jetbrains.kotlin.gradle.dsl.${MARKER}
    }
  }
}
`;

module.exports = config =>
  withProjectBuildGradle(config, config => {
    if (config.modResults.language !== "groovy") {
      throw new Error("with-android-kotlin-jvm-target only supports a Groovy project build.gradle");
    }
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents = `${config.modResults.contents.trimEnd()}\n${BLOCK}`;
    }
    return config;
  });
