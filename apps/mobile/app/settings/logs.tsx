import { Layout, LayoutButton } from "~/components/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Pressable } from "~/components/ui/pressable";
import { useQuery } from "@tanstack/react-query";
import { deleteLogContent, getLogList } from "~/utils/logger";
import { Text } from "~/components/ui/text";
import { StyleSheet, View } from "react-native";
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
  const { data, refetch } = useQuery<string[]>({
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
          <Text style={[styles.footer, { paddingBottom: edgeInsets.bottom + 16 }]}>超过 14 天的日志会被自动删除</Text>
        }
        renderItem={e => {
          const info = matchRegex.exec(e.item) as RegExpExecArray | null;
          const infoOld = matchOldRegex.exec(e.item) as RegExpExecArray | null;

          let text = "未知日志";
          if (info) {
            text = `${info[4]}-${info[3].padStart(2, "0")}-${info[2].padStart(2, "0")}（版本 ${info[1]}）`;
          }
          if (infoOld) {
            text = `${infoOld[3]}-${infoOld[2].padStart(2, "0")}-${infoOld[1].padStart(2, "0")}`;
          }

          return (
            <Pressable style={styles.row} onPress={() => router.navigate(`/settings/log/${e.item}`)}>
              <View style={styles.rowHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name={"fa6-solid:file-lines"} size={20} color={colorValue("--color-typography-700")} />
                </View>
                <Text style={styles.rowTitle} isTruncated>
                  {text}
                </Text>
              </View>
              <Text style={[styles.rowSubtitle, { color: colorValue("--color-typography-500") }]} isTruncated>
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
            <Heading style={[styles.dialogHeading, { color: colorValue("--color-typography-950") }]} size="md">
              {dialogInfo.title}
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text size="sm" style={styles.dialogDescription}>
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

const styles = StyleSheet.create({
  footer: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    opacity: 0.6,
    paddingTop: 16,
    textAlign: "center",
  },
  row: {
    height: 72,
    paddingHorizontal: 16,
    gap: 6,
    justifyContent: "center",
  },
  rowHeader: {
    flexDirection: "row",
    gap: 12,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
  },
  rowTitle: {
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 36,
  },
  dialogHeading: {
    fontWeight: "600",
  },
  dialogDescription: {
    lineHeight: 22,
  },
});
