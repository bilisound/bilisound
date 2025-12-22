import { View } from "react-native";

import { Text } from "~/components/ui/text";
import { shadow } from "~/constants/styles";
import { ToastConfig } from "react-native-toast-message/lib/src/types";
import React from "react";
import { Icon } from "~/components/icon";
import colors from "tailwindcss/colors";

export interface NotifyToastProps {
  type: "success" | "info" | "warning" | "error";
  title: string;
  description?: string;
}

export function NotifyToast({ type, title, description }: NotifyToastProps) {
  return (
    <View
      style={{ boxShadow: shadow.xl }}
      className="bg-background-0 border-background-100 border min-h-[50px] rounded-[25px] pl-3 pr-[1.125rem] py-[0.8125rem] flex-row gap-3 mx-6 my-2 max-w-[400px]"
    >
      <View className={"size-6 items-center justify-center flex-0 basis-auto"}>
        {type === "success" && <Icon name="ion:checkmark-circle" color={colors.green[500]} size={24} />}
        {type === "info" && <Icon name="ion:information-circle" color={colors.neutral[500]} size={24} />}
        {type === "warning" && <Icon name="ion:alert-circle" color={colors.orange[500]} size={24} />}
        {type === "error" && <Icon name="ion:close-circle" color={colors.red[500]} size={24} />}
      </View>
      <View className="gap-1 flex-1">
        <Text className="text-base leading-normal font-semibold" aria-live="assertive" aria-atomic="true" role="alert">
          {title}
        </Text>
        {description ? <Text className="text-sm leading-normal">{description}</Text> : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => <NotifyToast type="success" title={text1 ?? ""} description={text2} />,
  info: ({ text1, text2 }) => <NotifyToast type="info" title={text1 ?? ""} description={text2} />,
  warning: ({ text1, text2 }) => <NotifyToast type="warning" title={text1 ?? ""} description={text2} />,
  error: ({ text1, text2 }) => <NotifyToast type="error" title={text1 ?? ""} description={text2} />,
};
