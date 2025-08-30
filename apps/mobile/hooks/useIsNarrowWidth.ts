import { useWindowSize } from "~/hooks/useWindowSize";

export function useIsNarrowWidth() {
  const windowDimensions = useWindowSize();
  return windowDimensions.height < 480;
}
