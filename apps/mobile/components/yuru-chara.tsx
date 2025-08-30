import { Image } from "expo-image";
import React, { forwardRef } from "react";
import { View, ViewProps } from "react-native";

import useSettingsStore from "~/store/settings";
import { twMerge } from "tailwind-merge";

export const YuruChara = forwardRef<View, ViewProps>((props, ref) => {
  const { theme } = useSettingsStore(state => ({ theme: state.theme }));

  let source;

  switch (theme) {
    case "red": {
      source = require("../assets/images/bg-corner-red.webp");
      break;
    }
    case "classic":
    default: {
      source = require("../assets/images/bg-corner-classic.svg");
      break;
    }
  }

  return (
    <View
      {...props}
      ref={ref}
      className={twMerge(
        `w-[15rem] aspect-square absolute right-0 bottom-[120px] z-10 pointer-events-none`,
        props.className,
      )}
    >
      <Image source={source} className="w-[15rem] aspect-square opacity-20" />
    </View>
  );
});

YuruChara.displayName = "YuruChara";
