import type { StorybookConfig } from "@storybook/react-native-web-vite";
import svgr from "vite-plugin-svgr";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-native-web-vite",
    options: {},
  },
  viteFinal: viteConfig => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), svgr({ include: "**/*.svg" })],
  }),
};

export default config;
