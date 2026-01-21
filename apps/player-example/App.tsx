import { setDefaultHeaders } from "@bilisound/player";
import { registerBackgroundEventListener } from "@bilisound/player/events";
import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { Control } from "~/components/Control";
import { Downloads } from "~/components/Downloads";
import { Playlist } from "~/components/Playlist";

type Pages = "control" | "playlist" | "downloads";

console.log("副作用激活！！");

setDefaultHeaders({
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
});

registerBackgroundEventListener((data) => {
  console.log(JSON.stringify(data, null, 2));
});

export default function App() {
  const [page, setPage] = useState<Pages>("control");

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text>Music Player</Text>
        <View style={styles.row}>
          <Button onPress={() => setPage("control")} title="Control" />
          <Button onPress={() => setPage("playlist")} title="Playlist" />
          <Button onPress={() => setPage("downloads")} title="Downloads" />
        </View>
        {page === "control" && <Control />}
        {page === "playlist" && <Playlist />}
        {page === "downloads" && <Downloads />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
    padding: 16,
    gap: 8,
    paddingBottom: 100,
  },
  row: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
});
