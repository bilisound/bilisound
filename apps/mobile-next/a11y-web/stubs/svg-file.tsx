import { createElement } from "react";

/**
 * jest stand-in for the metro svg-transformer: `import Icon from "….svg"` yields a
 * component. The web tests only care about the accessibility props that flow
 * through the icon, so this renders a plain, passive <svg> and keeps everything
 * else (aria-hidden, width/height) untouched.
 */
export default function SvgFileStub(props: Record<string, unknown>) {
  return createElement("svg", props);
}
