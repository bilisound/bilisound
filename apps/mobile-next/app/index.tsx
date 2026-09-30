import { useState } from "react";
import { Button, HStack, Text, TextInput, VStack } from "@bilisound/ui";
import { isWeb, View } from "@tamagui/core";
import { router } from "expo-router";

import { AppLayout } from "~/components/app-layout";
import { BRAND } from "~/constants/branding";
import { normalizeVideoQuery } from "~/features/bilibili/discovery";
import { resolveVideoAndJump } from "~/features/bilibili";
import log from "~/utils/logger";

const INVALID_INPUT_MESSAGE = "请输入合法的地址或 ID";

/**
 * 查询页：输入 av/BV 号、视频链接、b23 短链或用户列表链接，
 * 解析成功后跳转视频详情或远程列表（搬运 v2 `(main)/index.tsx`）。
 */
export default function QueryScreen() {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const value = normalizeVideoQuery(input);
    if (!value) {
      setInputError(INVALID_INPUT_MESSAGE);
      return;
    }

    log.info("用户执行查询操作");
    log.debug(`查询关键词: ${value}`);
    setSubmitting(true);
    try {
      await resolveVideoAndJump(value);
      setInputError(undefined);
    } catch (error) {
      log.info(`无法执行搜索操作，因此不响应用户提交。原因：${error}`);
      setInputError(INVALID_INPUT_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="查询"
      actions={
        <>
          <Button
            aria-label="扫描二维码"
            icon="uil:qrcode-scan"
            onPress={() => router.navigate("/barcode")}
            shape="rounded"
            size="lg"
            variant="ghost"
          />
          <Button
            aria-label="历史记录"
            icon="fa6-solid:clock-rotate-left"
            onPress={() => router.navigate("/history")}
            shape="rounded"
            size="lg"
            variant="ghost"
          />
        </>
      }
    >
      <VStack alignItems="center" gap="$6" paddingBottom="$12" paddingHorizontal="$4" paddingTop="$10">
        <Text bold color="$primaryText" size="3xl">
          {BRAND.toUpperCase()}
        </Text>
        <VStack gap="$2" maxWidth={560} width="100%">
          <HStack alignItems="center" gap="$2">
            <View flex={1}>
              <TextInput
                aria-label="视频链接或 ID"
                // Web 没有可引用的描述节点，hint 保持 native-only（RN 未提供 aria-describedby）。
                {...(isWeb ? null : { accessibilityHint: "输入后点击查询按钮打开音视频详情" })}
                autoCapitalize="none"
                autoCorrect={false}
                invalid={Boolean(inputError)}
                onChangeText={value => {
                  setInput(value);
                  if (inputError) {
                    setInputError(undefined);
                  }
                }}
                onSubmitEditing={handleSubmit}
                placeholder="粘贴完整链接或带前缀 ID 至此"
                returnKeyType="search"
                size="lg"
                value={input}
              />
            </View>
            {input ? (
              <Button
                aria-label="清空查询内容"
                icon="fa6-solid:xmark"
                onPress={() => setInput("")}
                shape="rounded"
                variant="ghost"
              />
            ) : null}
            <Button disabled={submitting} onPress={handleSubmit} shape="rounded">
              查询
            </Button>
          </HStack>
          {inputError ? (
            <Text color="$danger" size="sm">
              {inputError}
            </Text>
          ) : null}
        </VStack>
      </VStack>
    </AppLayout>
  );
}
