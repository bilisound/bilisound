import { Image as ExpoImage } from "expo-image";
import { styled } from "nativewind";

/** expo-image with className support; NativeWind v5 no longer patches third-party components globally. */
export const Image = styled(ExpoImage, { className: "style" });
