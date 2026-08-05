import React, { useContext, useMemo } from "react";
import { InsidePageContext } from "~/components/main-bottom-sheet/utils";
import { jump, toggle, usePlaybackOrder, useQueue } from "@bilisound/player";
import { FlashList } from "@shopify/flash-list";
import { useBottomSheetScrollableCreator } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { SongItem } from "~/components/song-item";

export function PlayerQueueList() {
  const isInsidePage = useContext(InsidePageContext);
  const queue = useQueue();
  const playbackOrder = usePlaybackOrder();
  const renderScrollComponent = useBottomSheetScrollableCreator();

  /**
   * 按播放顺序展示队列：随机模式下这就是「打乱后的列表」，当前曲目在首位。
   *
   * `queue` 与 `playbackOrder` 来自两个独立的订阅，队列变化时可能有一帧不同步，
   * 所以长度不匹配时退回 canonical 顺序，避免渲染出空洞。
   */
  const orderedQueue = useMemo(() => {
    if (playbackOrder.length !== queue.length) {
      return queue.map((track, index) => ({ track, canonicalIndex: index }));
    }
    return playbackOrder.map(canonicalIndex => ({ track: queue[canonicalIndex], canonicalIndex }));
  }, [queue, playbackOrder]);

  async function handleJump(index: number) {
    await jump(index);
  }

  return (
    <View className={"pb-2 md:py-0 flex-1"}>
      <FlashList
        data={orderedQueue}
        className={"md:py-2.5"}
        keyExtractor={item => `${item.canonicalIndex}`}
        {...(!isInsidePage && { renderScrollComponent: renderScrollComponent })}
        renderItem={({ item, index }) => (
          <SongItem
            data={{
              title: item.track.title!,
              duration: item.track.duration!,
              author: "",
              bvid: item.track.extendedData!.id,
              episode: item.track.extendedData!.episode,
            }}
            index={index + 1}
            onRequestPlay={() => handleJump(item.canonicalIndex)}
            onToggle={() => toggle()}
          />
        )}
      />
    </View>
  );
}
