import { Text } from "~/components/ui/text";
import { useTabSafeAreaInsets } from "~/hooks/useTabSafeAreaInsets";
import { ScrollView, StyleSheet, View } from "react-native";
import { Layout, LayoutButton } from "~/components/layout";
import { useIsNarrowWidth } from "~/hooks/useIsNarrowWidth";
import { useForm, Controller } from "react-hook-form";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "~/components/ui/form-control";
import { TextField, TextFieldAction, useUiNextColors } from "~/components/ui-next";
import log from "~/utils/logger";
import { AlertCircleIcon } from "~/components/ui/icon";
import React from "react";
import { router } from "expo-router";
import { resolveVideo, resolveVideoAndJump } from "~/business/format";
import { Icon } from "~/components/icon";
import { BRAND } from "~/constants/branding";

export default function MainScreen() {
  const edgeInsets = useTabSafeAreaInsets();
  const isNarrowWidth = useIsNarrowWidth();
  const { colorValue } = useUiNextColors();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue: setFormValue,
    watch,
  } = useForm({
    defaultValues: {
      videoUrl: "",
    },
  });

  const videoUrl = watch("videoUrl");

  const onSubmit = async (data: { videoUrl: string }) => {
    log.info("用户执行查询操作");
    log.debug(`查询关键词: ${data.videoUrl}`);
    try {
      await resolveVideoAndJump(data.videoUrl);
    } catch (error) {
      log.info(`无法执行搜索操作，因此不响应用户提交。原因：${error}`);
    }
  };

  return (
    <Layout
      edgeInsets={edgeInsets}
      rightAccessories={
        <>
          <LayoutButton
            iconName={"uil:qrcode-scan"}
            aria-label={"扫描二维码"}
            iconSize={22}
            onPress={() => {
              router.navigate("/barcode");
            }}
          />
          <LayoutButton
            iconName={"fa6-solid:clock-rotate-left"}
            aria-label={"历史记录"}
            onPress={() => {
              router.navigate("/history");
            }}
          />
        </>
      }
    >
      {/* 解决键盘不收回的问题 */}
      <ScrollView className={"flex-1"}>
        <View className={`${isNarrowWidth ? "pt-6 pb-8" : "pt-10 pb-12"} items-center`}>
          <Text
            className="text-3xl text-primary-500 dark:text-primary-400 h-12 leading-12"
            style={{
              fontFamily: "Poppins_700Bold",
            }}
          >
            {BRAND.toUpperCase()}
          </Text>
        </View>
        <View className="px-4 items-center">
          <FormControl
            isDisabled={false}
            isInvalid={!!errors.videoUrl}
            isReadOnly={false}
            isRequired={false}
            size="md"
            className="w-full sm:w-[560px] bg-transparent"
          >
            <Controller
              control={control}
              name="videoUrl"
              rules={{
                validate: async value => {
                  try {
                    await resolveVideo(value);
                    return true;
                  } catch {
                    return false;
                  }
                },
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextField
                  accessibilityHint="输入后点击查询按钮打开音视频详情"
                  accessibilityLabel="视频链接或 ID"
                  containerStyle={styles.videoInput}
                  invalid={!!errors.videoUrl}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={handleSubmit(onSubmit)}
                  placeholder="粘贴完整链接或带前缀 ID 至此"
                  returnKeyType="search"
                  right={
                    !!videoUrl && (
                      <>
                        <TextFieldAction
                          accessibilityLabel="清空查询内容"
                          onPress={() => {
                            setFormValue("videoUrl", "");
                          }}
                        >
                          <Icon name="fa6-solid:xmark" size={20} color={colorValue("--color-typography-700")} />
                        </TextFieldAction>
                        <View
                          style={[styles.inputDivider, { backgroundColor: colorValue("--color-background-100") }]}
                        />
                        <TextFieldAction
                          accessibilityHint="提交当前输入内容"
                          accessibilityLabel="查询"
                          onPress={handleSubmit(onSubmit)}
                          textColor={colorValue("--color-accent-500")}
                        >
                          查询
                        </TextFieldAction>
                      </>
                    )
                  }
                  size="md"
                  value={value}
                />
              )}
            />
            <FormControlError>
              <FormControlErrorIcon as={AlertCircleIcon} />
              <FormControlErrorText size="sm">请输入合法的地址或 ID</FormControlErrorText>
            </FormControlError>
          </FormControl>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  videoInput: {
    height: 48,
    borderRadius: 8,
  },
  inputDivider: {
    width: 1,
    height: 24,
  },
});
