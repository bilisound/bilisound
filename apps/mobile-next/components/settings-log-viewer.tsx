import { Platform, ScrollView, StyleSheet } from "react-native";

import { Text } from "@bilisound/ui";

export interface SettingsLogViewerProps {
  text?: string;
}

/**
 * 日志文本查看器。v2 在原生端使用 expo/dom 渲染以便处理大日志，
 * Next 先用普通 ScrollView + 等宽字体保证可用性（后续如有性能问题再换 DOM）。
 */
export function SettingsLogViewer({ text = "" }: SettingsLogViewerProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <Text selectable style={styles.text}>
        {text}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  text: {
    fontFamily: Platform.select({ android: "monospace", default: "monospace", ios: "Menlo" }),
    fontSize: 14,
    lineHeight: 20,
  },
});
