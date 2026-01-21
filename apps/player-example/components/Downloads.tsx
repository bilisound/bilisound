import {
  pauseDownload,
  removeDownload,
  resumeDownload,
} from "@bilisound/player";
import * as BilisoundPlayer from "@bilisound/player";
import { useDownloadTasks } from "@bilisound/player/hooks/useDownloadTasks";
import { DownloadState } from "@bilisound/player/types";
import { View, Text, StyleSheet, Button, ToastAndroid } from "react-native";

import { getBilisoundResourceUrl, getVideoUrl } from "~/api/bilisound";
import { AddCustom } from "~/components/AddCustom";
import { TEST_HOST } from "~/constants/network";

async function downloadBiliTrack(id: string, episode = 1) {
  const res = await getBilisoundResourceUrl({ id, episode });
  console.log(res);
  await BilisoundPlayer.addDownload(`bs_${id}_${episode}`, res.url, {
    headers: {
      referer: getVideoUrl(id, episode),
    },
  });
  ToastAndroid.show("下载添加成功：" + id + ", " + episode, 5000);
}

export function Downloads() {
  const tasks = useDownloadTasks();

  return (
    <View>
      <Text>Downloads</Text>
      <AddCustom onSubmit={(e) => downloadBiliTrack(e, 1)} />
      <View style={styles.row}>
        <Button
          onPress={async () => {
            await downloadBiliTrack("BV1b84y187WC");
          }}
          title="DL 1"
        />
        <Button
          onPress={async () => {
            await downloadBiliTrack("BV1bb4se5ENA");
          }}
          title="DL 2"
        />
        <Button
          onPress={async () => {
            await downloadBiliTrack("BV1kw411t7iy");
          }}
          title="DL 3"
        />
        <Button
          onPress={async () => {
            await downloadBiliTrack("BV1NH4y1c723");
          }}
          title="DL 4"
        />
        <Button
          onPress={async () => {
            await downloadBiliTrack("BV19U411U7rb");
          }}
          title="DL 5"
        />
      </View>
      <View style={[styles.row, { paddingTop: 8 }]}>
        <Button
          onPress={async () => {
            await BilisoundPlayer.addDownload(
              "test_track_5",
              `${TEST_HOST}/%E5%AE%89%E4%BA%95%E6%B4%8B%E4%BB%8B/%E3%81%BE%E3%82%82%E3%82%8B%E3%82%AF%E3%83%B3%E3%81%AF%E5%91%AA%E3%82%8F%E3%82%8C%E3%81%A6%E3%81%97%E3%81%BE%E3%81%A3%E3%81%9F%EF%BC%81%E3%82%A2%E3%83%AC%E3%83%B3%E3%82%B7%E3%82%99%E3%83%88%E3%83%A9%E3%83%83%E3%82%AF%E3%82%B9/05%20YO-KAI%20Disco%20(%E5%86%A5%E7%95%8C%E5%85%A5%E5%8F%A3%E3%83%AF%E3%83%BC%E3%83%AB%E3%83%89).m4a`,
              {
                headers: {
                  "User-Agent": "zehuoge",
                },
              },
            );
          }}
          title="DL 5"
        />
        <Button
          onPress={async () => {
            await BilisoundPlayer.addDownload(
              "test_track_6",
              `${TEST_HOST}/%E5%AE%89%E4%BA%95%E6%B4%8B%E4%BB%8B/%E3%81%BE%E3%82%82%E3%82%8B%E3%82%AF%E3%83%B3%E3%81%AF%E5%91%AA%E3%82%8F%E3%82%8C%E3%81%A6%E3%81%97%E3%81%BE%E3%81%A3%E3%81%9F%EF%BC%81%E3%82%A2%E3%83%AC%E3%83%B3%E3%82%B7%E3%82%99%E3%83%88%E3%83%A9%E3%83%83%E3%82%AF%E3%82%B9/06%20Blossom%20Shower%20(%E6%A1%9C%E3%81%AE%E5%8F%A4%E9%83%B7%E3%83%AF%E3%83%BC%E3%83%AB%E3%83%89%E3%83%BB%E5%89%8D%E5%8D%8A).m4a`,
              {
                headers: {
                  "User-Agent": "zehuoge",
                },
              },
            );
          }}
          title="DL 6"
        />
        <Button
          onPress={async () => {
            await BilisoundPlayer.addDownload(
              "test_track_large",
              `https://ash-speed.hetzner.com/1GB.bin`,
              {
                headers: {
                  "User-Agent": "zehuoge",
                },
              },
            );
          }}
          title="DL large"
        />
      </View>
      <View style={styles.list}>
        {tasks.map((tasks) => {
          return (
            <View style={styles.listItem} key={tasks.id}>
              <Text selectable>{tasks.id}</Text>
              <Text>{`${(tasks.bytesDownloaded / tasks.bytesTotal) * 100}%`}</Text>
              <View style={styles.listAction}>
                <Button
                  title="Delete"
                  onPress={() => removeDownload(tasks.id)}
                />
                {tasks.state === DownloadState.STATE_DOWNLOADING && (
                  <Button
                    title="Pause"
                    onPress={() => pauseDownload(tasks.id)}
                  />
                )}
                {tasks.state !== DownloadState.STATE_DOWNLOADING &&
                  tasks.state !== DownloadState.STATE_COMPLETED && (
                    <Button
                      title={`Resume (${tasks.state})`}
                      onPress={() => resumeDownload(tasks.id)}
                    />
                  )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    marginTop: 8,
  },
  listItem: {
    gap: 4,
  },
  listAction: {
    gap: 8,
    flexDirection: "row",
  },
  row: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
});
