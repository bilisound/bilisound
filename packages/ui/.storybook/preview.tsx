import type { Preview } from "@storybook/react-native-web-vite";
import { View } from "@tamagui/core";

import { BilisoundProvider } from "../src";
import type { Appearance, ThemeName } from "../src";

const appearances = ["light", "dark"] as const satisfies readonly Appearance[];
const themes = ["classic", "red"] as const satisfies readonly ThemeName[];

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const appearance = appearances.includes(context.globals.appearance) ? context.globals.appearance : "light";
      const theme = themes.includes(context.globals.theme) ? context.globals.theme : "classic";

      return (
        <BilisoundProvider appearance={appearance} theme={theme}>
          <View backgroundColor="$canvas" padding="$6">
            <Story />
          </View>
        </BilisoundProvider>
      );
    },
  ],
  globalTypes: {
    appearance: {
      description: "Bilisound color appearance",
      toolbar: {
        items: [
          { title: "Light", value: "light" },
          { title: "Dark", value: "dark" },
        ],
      },
    },
    theme: {
      description: "Bilisound semantic theme",
      toolbar: {
        items: [
          { title: "Classic", value: "classic" },
          { title: "Red", value: "red" },
        ],
      },
    },
  },
  initialGlobals: {
    appearance: "light",
    theme: "classic",
  },
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Components", "*"],
      },
    },
  },
};

export default preview;
