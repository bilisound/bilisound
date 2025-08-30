"use dom";

import { DOMProps } from "expo/dom";

export interface LogViewerProps {
  text: string;
  className?: string;
  style?: any;
  dom: DOMProps;
}

export default function LogViewerDom({ text, style }: LogViewerProps) {
  return (
    <pre style={style}>
      <code
        style={{
          lineBreak: "anywhere",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
          fontSize: "14px",
          lineHeight: 1.25,
        }}
      >
        {text}
      </code>
    </pre>
  );
}
