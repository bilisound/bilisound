import Color from "colorjs.io";
import { useRawThemeValues } from "../gluestack-ui-provider/theme";
import { SwitchProps } from "./types";
import { Switch as AndroidSwitch } from "@expo/ui/jetpack-compose";

export const Switch = ({ value, onChange }: SwitchProps) => {
  const { colorValueMode } = useRawThemeValues();

  const color = colorValueMode({
    dark: { color: "--color-primary-400" },
    light: { color: "--color-primary-500" },
  });

  // Convert rgba/rgb color to #RRGGBB format for Android
  const hexColor = new Color(color).to("srgb").toString({ format: "hex" });

  return <AndroidSwitch value={value} onValueChange={onChange} color={hexColor} />;
};
