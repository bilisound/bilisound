import { ImageProps } from "expo-image/src/Image.types";
import { Image } from "expo-image";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import React from "react";

export interface ActionSheetCurrentProps {
  line1: string;
  line2: string;
  image?: ImageProps["source"];
}

export function ActionSheetCurrent({ line1, line2, image }: ActionSheetCurrentProps) {
  return (
    <View className={"flex-row items-center px-4 py-4 gap-4 w-full"}>
      {image ? <Image source={image} className={"h-12 aspect-[3/2] rounded-lg flex-0 basis-auto"} /> : null}
      <View className="flex-1 items-start w-full gap-1.5">
        <Text className="font-bold" isTruncated>
          {line1}
        </Text>
        <Text className="text-sm opacity-60">{line2}</Text>
      </View>
    </View>
  );
}
