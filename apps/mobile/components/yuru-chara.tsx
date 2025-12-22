import { Image } from "expo-image";
import React, { forwardRef } from "react";
import { View, ViewProps } from "react-native";

import useSettingsStore from "~/store/settings";
import { twMerge } from "tailwind-merge";
import BgCornerClassic from "~/assets/images/bg-corner-classic.svg";

export const YuruChara = forwardRef<View, ViewProps>((props, ref) => {
  const { theme } = useSettingsStore(state => ({ theme: state.theme }));

  // SVG 需要作为组件使用，webp 可以作为 Image source
  const isClassicTheme = theme === "classic" || !theme;

  return (
    <View
      {...props}
      ref={ref}
      className={twMerge(
        `w-[15rem] aspect-square absolute right-0 bottom-[120px] z-10 pointer-events-none`,
        props.className,
      )}
    >
      {isClassicTheme ? (
        <BgCornerClassic width="240px" height="240px" style={{ opacity: 0.4 }} />
      ) : (
        <Image source={require("../assets/images/bg-corner-red.webp")} className="w-[15rem] aspect-square opacity-15" />
      )}
    </View>
  );
});

YuruChara.displayName = "YuruChara";
