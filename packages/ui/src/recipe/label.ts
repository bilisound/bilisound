import { styled, Text, View } from "@tamagui/core";

export const LabelFrame = styled(Text, {
  name: "BilisoundLabelFrame",
  fontFamily: "$body",
  fontSize: "$sm",
  lineHeight: "$sm",
  fontWeight: "600",
  color: "$text",
  marginBottom: 8,
  userSelect: "none",
});

export const LabelRequiredMark = styled(Text, {
  name: "BilisoundLabelRequiredMark",
  fontFamily: "$body",
  fontSize: "$sm",
  lineHeight: "$sm",
  fontWeight: "600",
  color: "$danger",
  marginLeft: 2,
});

export const LabelErrorFrame = styled(View, {
  name: "BilisoundLabelErrorFrame",
  flexDirection: "row",
  alignItems: "center",
  gap: "$1",
  marginTop: "$1",
});

export const LabelErrorText = styled(Text, {
  name: "BilisoundLabelErrorText",
  flex: 1,
  fontFamily: "$body",
  fontSize: "$sm",
  lineHeight: "$sm",
  color: "$danger",
});
