import { Text } from "~/components/ui/text";
import { useTabSafeAreaInsets } from "~/hooks/useTabSafeAreaInsets";
import { ScrollView, View } from "react-native";
import { Layout, LayoutButton } from "~/components/layout";
import { useIsNarrowWidth } from "~/hooks/useIsNarrowWidth";
import { useForm, Controller } from "react-hook-form";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "~/components/ui/form-control";
import { Input, InputField, InputSlot } from "~/components/ui/input";
import log from "~/utils/logger";
import { AlertCircleIcon } from "~/components/ui/icon";
import React from "react";
import { router } from "expo-router";
import { resolveVideo, resolveVideoAndJump } from "~/business/format";
import { Icon } from "~/components/icon";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";
import { BRAND } from "~/constants/branding";

export default function MainScreen() {
  const edgeInsets = useTabSafeAreaInsets();
  const isNarrowWidth = useIsNarrowWidth();
  const { colorValue } = useRawThemeValues();

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
            <Input variant="outline" size="md" className="w-full h-12 rounded-lg">
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
                  <InputField
                    placeholder="粘贴完整链接或带前缀 ID 至此"
                    className="text-base"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
              {videoUrl && (
                <View className={"flex-row items-center"}>
                  <InputSlot
                    className="h-12 px-3 items-center justify-center"
                    onPress={() => {
                      setFormValue("videoUrl", "");
                    }}
                  >
                    <Icon name="fa6-solid:xmark" size={20} color={colorValue("--color-typography-700")} />
                  </InputSlot>
                  <View className={"w-[1px] h-6 bg-background-100"}></View>
                  <InputSlot className="h-12 px-3 items-center justify-center" onPress={handleSubmit(onSubmit)}>
                    <Text className={"text-accent-500"}>查询</Text>
                  </InputSlot>
                </View>
              )}
            </Input>
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
