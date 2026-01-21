import * as BilisoundPlayer from "@bilisound/player";
import { useCurrentTrack } from "@bilisound/player/hooks/useCurrentTrack";
import { useEvents } from "@bilisound/player/hooks/useEvents";
import { useIsPlaying } from "@bilisound/player/hooks/useIsPlaying";
import { usePlaybackState } from "@bilisound/player/hooks/usePlaybackState";
import { useProgress } from "@bilisound/player/hooks/useProgress";
import { useRepeatMode } from "@bilisound/player/hooks/useRepeatMode";
import {
  Button,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";

import {
  getBilisoundMetadata,
  getBilisoundResourceUrl,
  getVideoUrl,
} from "~/api/bilisound";
import { AddCustom } from "~/components/AddCustom";
import log from "~/utils/logger";

async function addBiliTrack(id: string, episode = 1) {
  const info = await getBilisoundMetadata({ id });
  const res = await getBilisoundResourceUrl({ id, episode });
  log.debug("添加曲目 URL: " + res.url);
  await BilisoundPlayer.addTracks([
    {
      id: `bs_${id}_${episode}`,
      uri: res.url,
      title: info.data.title,
      artist: info.data.owner.name,
      artworkUri: info.data.pic.replace(/^http:/, "https:"),
      duration: info.data.pages[episode - 1].duration,
      mimeType: "video/mp4",
      headers: {
        referer: getVideoUrl(id, episode),
      },
      extendedData: {
        foo: "bar",
      },
    },
  ]);
  if (Platform.OS === "android") {
    ToastAndroid.show("添加成功：" + id + ", " + episode, 5000);
  }
}

async function addInternetTrack(uri: string) {
  log.debug("添加曲目 URL: " + uri);
  await BilisoundPlayer.addTracks([
    {
      uri,
      id: uri,
      title: uri,
      headers: {
        foo: "bar",
        referer: "test-test",
      },
    },
  ]);
}

function RealTimeProgress() {
  const progress = useProgress();

  return <Text>{`Progress:\n${JSON.stringify(progress, null, 2)}`}</Text>;
}

export function Control() {
  useEvents("onPlaybackError", (e) => {
    console.log("onPlaybackError", e);
  });

  useEvents("onPlaybackStateChange", (e) => {
    console.log("onPlaybackStateChange", e);
  });

  async function handleGetAllTracks() {
    const result = await BilisoundPlayer.getTracks();
    console.log(JSON.stringify(result, null, 4));
  }

  const playbackState = usePlaybackState();
  const isPlaying = useIsPlaying();
  const currentTrack = useCurrentTrack();

  return (
    <View style={styles.container}>
      <RealTimeProgress />
      <Text>{`Playback State: ${playbackState}`}</Text>
      <Text>{`Playing: ${isPlaying}`}</Text>
      <Text>{`Repeating: ${useRepeatMode()}`}</Text>
      <Text>{`Current Track: ${JSON.stringify(currentTrack, null, 2)}`}</Text>
      <Button
        onPress={async () =>
          console.log(
            JSON.stringify(await BilisoundPlayer.getCurrentTrack(), null, 2),
          )
        }
        title="Console Log Current Track"
      />
      <AddCustom onSubmit={(e) => addBiliTrack(e.trim())} />
      <AddCustom
        prefix="Add URL:"
        onSubmit={(e) => addInternetTrack(e.trim())}
      />
      <View style={styles.row}>
        <Button
          onPress={async () => {
            await addBiliTrack("BV1JD421A7C4");
          }}
          title="Add 1"
        />
        <Button
          onPress={async () => {
            await addBiliTrack("BV1bb4se5ENA");
          }}
          title="Add 2"
        />
        <Button
          onPress={async () => {
            await addBiliTrack("BV1kw411t7iy");
          }}
          title="Add 3"
        />
        <Button
          onPress={async () => {
            await addBiliTrack("BV1NH4y1c723");
          }}
          title="Add 4"
        />
        <Button
          onPress={async () => {
            await addBiliTrack("BV19U411U7rb");
          }}
          title="Add 5"
        />
      </View>
      <Button
        onPress={async () =>
          await BilisoundPlayer.replaceTrack(1, {
            id: "test_song",
            uri: "https://assets.tcdww.cn/website/test/14%20Horsey%20(feat.%20Sarah%20Bonito).m4a",
            artworkUri: "https://assets.tcdww.cn/website/test/8%20(106).jpg",
            title: "测试标题 " + Math.random(),
          })
        }
        title="Replace index 1"
      />
      <View style={styles.row}>
        <Button onPress={() => BilisoundPlayer.saveFile("/data/data/moe.bilisound.player.example/files/test.m4a", "audio/mp4", "测试.m4a")} title="Save" />
        <Button onPress={() => BilisoundPlayer.saveFile("/data/data/moe.bilisound.player.example/files/test2.m4a", "audio/mp4", "test2.m4a")} title="Save (Error)" />
      </View>
      <View style={styles.row}>
        <Button onPress={() => BilisoundPlayer.prev()} title="Prev" />
        <Button onPress={() => BilisoundPlayer.toggle()} title="Toggle" />
        <Button onPress={() => BilisoundPlayer.next()} title="Next" />
        <Button onPress={() => BilisoundPlayer.seek(20)} title="seek 20 秒" />
      </View>
      <View style={styles.row}>
        <Button
          title="不循环"
          onPress={() => BilisoundPlayer.setRepeatMode(0)}
        />
        <Button
          title="单曲循环"
          onPress={() => BilisoundPlayer.setRepeatMode(1)}
        />
        <Button
          title="列表循环"
          onPress={() => BilisoundPlayer.setRepeatMode(2)}
        />
      </View>
      <View style={styles.row}>
        <Button
          onPress={() => BilisoundPlayer.setSpeed(50 / 60, false)}
          title="50 / 60"
        />
        <Button
          onPress={() => BilisoundPlayer.setSpeed(0.9, false)}
          title="0.9"
        />
        <Button onPress={() => BilisoundPlayer.setSpeed(1.0)} title="1.0" />
        <Button
          onPress={() => BilisoundPlayer.setSpeed(1.1, false)}
          title="1.1"
        />
        <Button
          onPress={() => BilisoundPlayer.setSpeed(1.2, false)}
          title="1.2"
        />
        <Button
          onPress={() => BilisoundPlayer.setSpeed(2.0, false)}
          title="2.0"
        />
      </View>
      <Button
        onPress={() => BilisoundPlayer.deleteTracks([2, 1])}
        title="Delete Track index 2, 1"
      />
      <Button onPress={handleGetAllTracks} title="Get All Tracks" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-start",
    gap: 8,
  },
  row: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
});
