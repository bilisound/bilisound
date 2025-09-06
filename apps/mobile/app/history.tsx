import useHistoryStore from "~/store/history";
import { Layout, LayoutButton } from "~/components/layout";
import { FlashList } from "@shopify/flash-list";
import { VideoItem } from "~/components/video-item";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getImageProxyUrl } from "~/business/constant-helper";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
} from "~/components/ui/alert-dialog";
import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Heading } from "~/components/ui/heading";
import Toast from "react-native-toast-message";
import { View } from "react-native";

export default function Page() {
  // 历史记录信息
  const { historyList, clearHistoryList, repairHistoryList } = useHistoryStore(state => ({
    historyList: state.historyList,
    clearHistoryList: state.clearHistoryList,
    repairHistoryList: state.repairHistoryList,
  }));

  useEffect(() => {
    repairHistoryList();
  }, [repairHistoryList]);

  const edgeInsets = useSafeAreaInsets();

  // 确认对话框
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const handleClose = () => setShowAlertDialog(false);
  const handleOpen = () => setShowAlertDialog(true);

  const handleToast = () => {
    clearHistoryList();
    Toast.show({
      type: "success",
      text1: "已清空历史记录",
    });
  };

  const dialogContent = (
    <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size="md">
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Heading className="text-typography-950 font-semibold" size="md">
            操作确认
          </Heading>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text size="sm" className="leading-normal">
            确定要清空历史记录吗？
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <ButtonOuter>
            <Button variant="ghost" action="secondary" onPress={handleClose}>
              <ButtonText>取消</ButtonText>
            </Button>
          </ButtonOuter>
          <ButtonOuter>
            <Button
              onPress={() => {
                handleToast();
                handleClose();
              }}
            >
              <ButtonText>确定</ButtonText>
            </Button>
          </ButtonOuter>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <Layout
      title={"历史记录"}
      leftAccessories={"BACK_BUTTON"}
      rightAccessories={
        historyList.length > 0 ? <LayoutButton iconName={"fa6-solid:trash-can"} onPress={handleOpen} /> : null
      }
      edgeInsets={{
        ...edgeInsets,
        bottom: 0,
      }}
    >
      {historyList.length > 0 ? (
        <FlashList
          contentContainerStyle={{
            paddingBottom: edgeInsets.bottom,
          }}
          renderItem={({ item }) => {
            return (
              <VideoItem
                text1={item.name}
                text2={item.authorName}
                image={getImageProxyUrl(item.thumbnailUrl, "https://www.bilibili.com/video/" + item.id)}
                onPress={() => {
                  router.navigate(`/video/${item.id}`);
                }}
              />
            );
          }}
          data={historyList}
        />
      ) : (
        <View className={"flex-1 items-center justify-center gap-4"}>
          <Text className={"leading-normal text-sm font-semibold color-typography-500"}>这里空空如也</Text>
          <ButtonOuter>
            <Button onPress={() => router.back()}>
              <ButtonText>去查询</ButtonText>
            </Button>
          </ButtonOuter>
        </View>
      )}
      {dialogContent}
    </Layout>
  );
}
