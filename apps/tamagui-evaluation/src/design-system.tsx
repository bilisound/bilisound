import type { ReactNode } from "react";
import { ScrollView as ReactNativeScrollView } from "react-native";
import { Button as TamaguiButton } from "@tamagui/button";
import { styled, Text, View } from "@tamagui/core";

export const YStack = styled(View, {
  name: "BilisoundYStack",
  flexDirection: "column",
});

export const XStack = styled(View, {
  name: "BilisoundXStack",
  flexDirection: "row",
});

export const ScrollView = styled(ReactNativeScrollView, {
  name: "BilisoundScrollView",
});

export const Card = styled(YStack, {
  name: "BilisoundCard",
  gap: "$4",
  padding: "$5",
  backgroundColor: "$surface",
  borderColor: "$border",
  borderWidth: 1,
  borderRadius: "$4",
});

export const Eyebrow = styled(Text, {
  name: "BilisoundEyebrow",
  color: "$textMuted",
  fontFamily: "$body",
  fontSize: "$1",
  fontWeight: "700",
  letterSpacing: 1.6,
  textTransform: "uppercase",
});

export const Title = styled(Text, {
  name: "BilisoundTitle",
  render: "h1",
  color: "$text",
  fontFamily: "$heading",
  fontSize: "$8",
  fontWeight: "700",
  letterSpacing: -1.8,
  lineHeight: "$8",
  $sm: {
    fontSize: "$7",
    lineHeight: "$7",
  },
});

export const Heading = styled(Text, {
  name: "BilisoundHeading",
  render: "h2",
  color: "$text",
  fontFamily: "$heading",
  fontSize: "$5",
  fontWeight: "700",
  letterSpacing: -0.3,
  lineHeight: "$5",
});

export const Body = styled(Text, {
  name: "BilisoundBody",
  color: "$text",
  fontFamily: "$body",
  fontSize: "$3",
  lineHeight: "$3",
});

interface BilisoundButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

export function BilisoundButton({ children, disabled, onPress, variant = "primary" }: BilisoundButtonProps) {
  const primary = variant === "primary";

  return (
    <TamaguiButton
      unstyled
      alignItems="center"
      justifyContent="center"
      minHeight="$5"
      paddingHorizontal="$4"
      borderRadius="$3"
      borderWidth={1}
      borderColor={primary ? "$buttonBorder" : "$buttonSecondaryBorder"}
      backgroundColor={primary ? "$buttonBackground" : "$buttonSecondaryBackground"}
      disabled={disabled}
      opacity={disabled ? 0.45 : 1}
      onPress={onPress}
      hoverStyle={{
        backgroundColor: primary ? "$buttonBackgroundHover" : "$buttonSecondaryBackgroundHover",
        borderColor: primary ? "$buttonBorderHover" : "$buttonSecondaryBorderHover",
      }}
      pressStyle={{
        backgroundColor: primary ? "$buttonBackgroundPress" : "$buttonSecondaryBackgroundPress",
      }}
      focusVisibleStyle={{
        outlineColor: "$focusRing",
        outlineStyle: "solid",
        outlineWidth: 3,
      }}
    >
      <Text color={primary ? "$buttonText" : "$buttonSecondaryText"} fontFamily="$body" fontSize="$2" fontWeight="700">
        {children}
      </Text>
    </TamaguiButton>
  );
}
