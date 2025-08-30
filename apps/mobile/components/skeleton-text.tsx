import { VStack } from "./ui/vstack";
import { Skeleton } from "~/components/ui/skeleton";

export interface SkeletonTextProps {
  lineSize?: number;
  lineHeight?: number;
  fontSize?: number;
  className?: string;
}

/**
 * 文字骨架屏
 */
export function SkeletonText({ lineHeight = 21, className, fontSize = 14, lineSize = 5 }: SkeletonTextProps) {
  const gap = lineHeight - fontSize;
  const paddingY = gap / 2;

  return (
    <VStack
      style={{
        // 使用 paddingVertical 在 web 不生效
        paddingTop: paddingY,
        paddingBottom: paddingY,
        gap,
      }}
      className={className}
      aria-hidden
    >
      {Array.from({ length: lineSize - 1 }).map((_, i) => (
        <Skeleton style={{ height: fontSize }} className="rounded-full w-full" key={i} />
      ))}
      <Skeleton style={{ height: fontSize }} className={`rounded-full ${lineSize === 1 ? "w-full" : "w-1/2"}`} />
    </VStack>
  );
}
