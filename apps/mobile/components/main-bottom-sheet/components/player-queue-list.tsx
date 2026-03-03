import React, { useContext } from "react";
import { InsidePageContext } from "~/components/main-bottom-sheet/utils";
import { jump, toggle, useQueue } from "@bilisound/player";
import { FlashList } from "@shopify/flash-list";
import { useBottomSheetScrollableCreator } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { SongItem } from "~/components/song-item";

export function PlayerQueueList() {
  const isInsidePage = useContext(InsidePageContext);
  const queue = useQueue();
  const renderScrollComponent = useBottomSheetScrollableCreator();

  async function handleJump(index: number) {
    await jump(index);
  }

  return (
    <View className={"pb-2 md:py-0 flex-1"}>
      <FlashList
        data={queue}
        className={"md:py-2.5"}
        {...(!isInsidePage && { renderScrollComponent: renderScrollComponent })}
        renderItem={({ item, index }) => (
          <SongItem
            data={{
              id: 0,
              title: item.title!,
              imgUrl: "",
              duration: item.duration!,
              extendedData: null,
              playlistId: 0,
              author: "",
              bvid: item.extendedData!.id,
              episode: item.extendedData!.episode,
            }}
            index={index + 1}
            onRequestPlay={() => handleJump(index)}
            onToggle={() => toggle()}
          />
        )}
      />
    </View>
  );
}
