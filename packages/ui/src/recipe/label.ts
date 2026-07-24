import { styled, Text } from "@tamagui/core";

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
