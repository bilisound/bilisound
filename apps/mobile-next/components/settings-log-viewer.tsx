import { useMemo } from "react";
import { FlatList, Platform, StyleSheet } from "react-native";

import { Text } from "@bilisound/ui";

export interface SettingsLogViewerProps {
  text?: string;
}

// iOS cannot draw a single text layer taller than the max texture size, so one <Text> holding the whole
// license (~680 KB) renders blank. Split into small line chunks and let FlatList virtualize them.
const LINES_PER_CHUNK = 40;

function splitIntoChunks(text: string): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_CHUNK) {
    chunks.push(lines.slice(i, i + LINES_PER_CHUNK).join("\n"));
  }
  return chunks;
}

/**
 * 日志文本查看器。v2 在原生端使用 expo/dom 渲染以便处理大日志，
 * Next 用按行分块的 FlatList + 等宽字体，避免超长文本在 iOS 上整块空白。
 */
export function SettingsLogViewer({ text = "" }: SettingsLogViewerProps) {
  const chunks = useMemo(() => splitIntoChunks(text), [text]);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={chunks}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item }) => (
        <Text selectable style={styles.text}>
          {item}
        </Text>
      )}
      style={styles.scroll}
    />
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
