import { Platform } from "react-native";
import LogViewerDomBase from "~/components/dom/LogViewerDom";
import React from "react";
import { styled } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LogViewerDom = styled(LogViewerDomBase, { className: "style" });

export interface LogViewerProps {
  text?: string;
}

export function LogViewer({ text = "" }: LogViewerProps) {
  const edgeInsets = useSafeAreaInsets();

  return Platform.OS === "web" ? (
    <pre className={"text-typography-700 p-4 m-0 w-full overflow-auto"}>
      <code className="break-all whitespace-pre-wrap text-[14px] leading-[1.25]">{text}</code>
    </pre>
  ) : (
    <LogViewerDom
      dom={{ matchContents: true }}
      text={text}
      className="text-typography-700 p-4 m-0 w-full"
      style={{
        paddingLeft: edgeInsets.left + 16,
        paddingRight: edgeInsets.right + 16,
        paddingBottom: edgeInsets.bottom + 16,
      }}
    />
  );
}
