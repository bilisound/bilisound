import { jump } from "@bilisound/player";
import { useQueue } from "@bilisound/player/hooks/useQueue";
import { View, Text, Pressable } from "react-native";

export function Playlist() {
  const queue = useQueue();

  return (
    <View>
      <Text>Playlist</Text>
      {queue.map((e, i) => {
        return (
          <Pressable
            android_ripple={{ color: "#dddddd" }}
            style={{ padding: 8 }}
            onPress={() => jump(i)}
            key={i}
          >
            <Text>{e.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
