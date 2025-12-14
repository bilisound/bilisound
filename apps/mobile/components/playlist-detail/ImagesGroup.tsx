import { View } from "react-native";
import { Image } from "expo-image";

interface ImagesGroupProps {
  images: string[];
}

export function ImagesGroup({ images }: ImagesGroupProps) {
  if (images.length === 0) {
    return <View className="aspect-video rounded-lg bg-background-100" />;
  }
  if (images.length >= 1 && images.length <= 3) {
    return <Image source={images[0]} className="aspect-video rounded-lg" />;
  }
  return (
    <View className="aspect-video rounded-lg overflow-hidden">
      <View className="flex-row flex-1">
        <Image className="aspect-video flex-1" source={images[0]} />
        <Image className="aspect-video flex-1" source={images[1]} />
      </View>
      <View className="flex-row flex-1">
        <Image className="aspect-video flex-1" source={images[2]} />
        <Image className="aspect-video flex-1" source={images[3]} />
      </View>
    </View>
  );
}
