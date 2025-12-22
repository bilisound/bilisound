import { Layout, LayoutButton } from "~/components/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Pressable } from "~/components/ui/pressable";
import { useQuery } from "@tanstack/react-query";
import { deleteLogContent, getLogList } from "~/utils/logger";
import { Text } from "~/components/ui/text";
import { View } from "react-native";
import { Icon } from "~/components/icon";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { router } from "expo-router";
import React from "react";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "~/components/ui/alert-dialog";
import { Heading } from "~/components/ui/heading";
import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { useConfirm } from "~/hooks/useConfirm";
import Toast from "react-native-toast-message";
import { matchOldRegex, matchRegex } from "~/utils/logger-common";

export default function Page() {
  const edgeInsets = useSafeAreaInsets();
  const { data, refetch } = useQuery({
    queryKey: ["log_list"],
    queryFn: getLogList,
  });
  const { colorValue } = useRawThemeValues();

  // 模态框管理
  const { dialogInfo, setDialogInfo, modalVisible, setModalVisible, handleClose, dialogCallback } = useConfirm();

  const handleDelete = async () => {
    dialogCallback.current = async () => {
      await deleteLogContent();
      await refetch();
      Toast.show({
        type: "success",
        text1: "历史日志清除成功",
      });
    };
    setDialogInfo(e => ({
      ...e,
      title: "清除历史日志确认",
      description: `确定要清除之前的历史日志吗？今日的日志不会被清除。`,
    }));
    setModalVisible(true);
  };

  return (
    <Layout
      title={"查看日志"}
      leftAccessories={"BACK_BUTTON"}
      rightAccessories={<LayoutButton iconName={"fa6-solid:trash-can"} onPress={() => handleDelete()} />}
      edgeInsets={{ ...edgeInsets, bottom: 0 }}
    >
      <FlashList
        contentContainerStyle={{ paddingBottom: edgeInsets.bottom }}
        ListFooterComponent={
          <Text className="text-sm px-5 opacity-60 pt-4 text-center" style={{ paddingBottom: edgeInsets.bottom + 16 }}>
            超过 14 天的日志会被自动删除
          </Text>
        }
        renderItem={e => {
          const info = matchRegex.exec(e.item);
          const infoOld = matchOldRegex.exec(e.item);

          let text = "未知日志";
          if (info) {
            text = `${info[4]}-${info[3].padStart(2, "0")}-${info[2].padStart(2, "0")}（版本 ${info[1]}）`;
          }
          if (infoOld) {
            text = `${infoOld[3]}-${infoOld[2].padStart(2, "0")}-${infoOld[1].padStart(2, "0")}`;
          }

          return (
            <Pressable
              className={"h-[72px] px-4 gap-1.5 justify-center"}
              onPress={() => router.navigate(`/settings/log/${e.item}`)}
            >
              <View className={"flex-row gap-3"}>
                <View className={"items-center justify-center size-6 flex-0 basis-auto"}>
                  <Icon name={"fa6-solid:file-lines"} size={20} color={colorValue("--color-typography-700")} />
                </View>
                <Text className={"font-semibold"} isTruncated>
                  {text}
                </Text>
              </View>
              <Text className={"text-typography-500 text-sm pl-9"} isTruncated>
                {e.item}
              </Text>
            </Pressable>
          );
        }}
        data={data}
      />

      {/* 对话框 */}
      <AlertDialog isOpen={modalVisible} onClose={() => handleClose(false)} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold" size="md">
              {dialogInfo.title}
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text size="sm" className="leading-normal">
              {dialogInfo.description}
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <ButtonOuter>
              <Button variant="ghost" onPress={() => handleClose(false)}>
                <ButtonText>{dialogInfo.cancel}</ButtonText>
              </Button>
            </ButtonOuter>
            <ButtonOuter>
              <Button onPress={() => handleClose(true)}>
                <ButtonText>{dialogInfo.ok}</ButtonText>
              </Button>
            </ButtonOuter>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
