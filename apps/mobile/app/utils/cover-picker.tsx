import { router, useLocalSearchParams } from "expo-router";
import { Layout } from "~/components/layout";
import { View } from "react-native";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlaylistDetail, setPlaylistMeta } from "~/storage/sqlite/playlist";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Pressable } from "~/components/ui/pressable";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "~/components/ui/alert-dialog";
import { Heading } from "~/components/ui/heading";
import Toast from "react-native-toast-message";
import { getImageProxyUrl } from "~/business/constant-helper";
import { useWindowSize } from "~/hooks/useWindowSize";

function determinePadding(index: number, amount: number, columns: number) {
  const row = Math.floor(index / columns);
  const lastRow = Math.floor((amount - 1) / columns);

  return {
    paddingTop: row === 0 ? 0 : 2,
    paddingBottom: row === lastRow ? 0 : 2,
    paddingHorizontal: 2,
  };
}

export default function CoverPicker() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: [`playlist_detail_img_picker_${listId}`],
    queryFn: async () => {
      const rawResult = await getPlaylistDetail(Number(listId));
      return rawResult.filter((item, index, self) => index === self.findIndex(t => t.imgUrl === item.imgUrl));
    },
  });

  const [userPickResult, setUserPickResult] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);

  async function handleClose(result: boolean) {
    setDialogVisible(false);
    if (!result) {
      return;
    }
    await handlePick();
  }

  function handlePickRandom() {
    if (!data) {
      return;
    }
    setUserPickResult(data[Math.floor(Math.random() * data.length)].imgUrl);
    setDialogVisible(true);
  }

  async function handlePick() {
    await setPlaylistMeta({
      id: Number(listId),
      imgUrl: userPickResult,
    });
    await queryClient.invalidateQueries({ queryKey: ["playlist_meta"] });
    await queryClient.invalidateQueries({ queryKey: ["playlist_meta_apply"] });
    await queryClient.invalidateQueries({ queryKey: [`playlist_meta_${listId}`] });
    Toast.show({
      type: "success",
      text1: "歌单封面修改成功",
    });
    handleBack();
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/(main)/(playlist)/detail/${listId}`);
    }
  }

  // 布局管理
  const windowDimensions = useWindowSize();
  let windowWidth = windowDimensions.width;
  const columns = Math.max(Math.floor(windowWidth / 200), 2);
  const columnHeight = windowWidth / columns;

  return (
    <Layout title="选择歌单封面" leftAccessories="BACK_BUTTON">
      <View className={"flex-1"}>
        <FlashList
          renderItem={e => (
            <View style={determinePadding(e.index, data?.length ?? 0, columns)} className={"flex-1"}>
              <Pressable
                onPress={() => {
                  setUserPickResult(e.item.imgUrl);
                  setDialogVisible(true);
                }}
                className={"w-full"}
                androidRipple={false}
              >
                <Image source={getImageProxyUrl(e.item.imgUrl)} className={"w-full aspect-square"} />
              </Pressable>
            </View>
          )}
          contentContainerStyle={{
            paddingHorizontal: 6,
          }}
          data={data ?? []}
          numColumns={columns}
        ></FlashList>
      </View>
      <View className={"p-2 gap-2"}>
        <View className={"flex-row gap-2"}>
          <ButtonOuter className={"flex-1"}>
            <Button className={"gap-3"} onPress={() => handlePickRandom()}>
              <ButtonMonIcon name={"fa6-solid:dice"} />
              <ButtonText>随机选择</ButtonText>
            </Button>
          </ButtonOuter>
          <ButtonOuter className={"flex-1"}>
            <Button onPress={() => handleBack()}>
              <ButtonMonIcon name={"fa6-solid:xmark"} size={20} />
              <ButtonText>取消</ButtonText>
            </Button>
          </ButtonOuter>
        </View>
      </View>

      {/* 对话框 */}
      <AlertDialog isOpen={dialogVisible} onClose={() => setDialogVisible(false)} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold" size="md">
              预览选择的图片
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-4 mb-6">
            <Image source={getImageProxyUrl(userPickResult)} className={"rounded-xl w-full aspect-video"} />
          </AlertDialogBody>
          <AlertDialogFooter>
            <ButtonOuter>
              <Button variant="ghost" onPress={() => handleClose(false)}>
                <ButtonText>放弃</ButtonText>
              </Button>
            </ButtonOuter>
            <ButtonOuter>
              <Button onPress={() => handleClose(true)}>
                <ButtonText>使用这张</ButtonText>
              </Button>
            </ButtonOuter>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
