import React from "react";
import { StyleProp, ViewStyle, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Text } from "~/components/ui/text";
import { PlaylistMeta } from "~/storage/sqlite/schema";
import { Pressable } from "~/components/ui/pressable";
import { Skeleton } from "~/components/ui/skeleton";
import { SkeletonText } from "~/components/skeleton-text";
import { Monicon } from "@monicon/native";
import { Image } from "expo-image";
import { getImageProxyUrl } from "~/business/constant-helper";
import { Svg, Polygon } from "react-native-svg";

export interface PlaylistItemProps {
    item?: PlaylistMeta;
    onPress?: () => void;
    onLongPress?: () => void;
    className?: string;
    style?: StyleProp<ViewStyle>;
    grid?: boolean;
}

/**
 * 歌单列表项
 */
export function PlaylistItem({ item, onPress, onLongPress, className, style, grid }: PlaylistItemProps) {
    let shell = (
        <>
            <View className="flex-row items-center gap-3">
                {item ? (
                    <View className="w-6 h-6 items-center justify-center basis-auto flex-0">
                        {item.source ? (
                            <Monicon name="fa6-solid:cloud" size={16} color={item.color} />
                        ) : (
                            <View
                                className="w-[0.875rem] h-[0.875rem] rounded-full"
                                style={[{ backgroundColor: item.color }]}
                            />
                        )}
                    </View>
                ) : (
                    <View className="w-6 h-6 items-center justify-center basis-auto flex-0">
                        <Skeleton className="w-[0.875rem] h-[0.875rem] rounded-full" />
                    </View>
                )}
                {item ? (
                    <Text className="text-base leading-normal flex-1" isTruncated>
                        {item.title}
                    </Text>
                ) : (
                    <View className={"flex-1"}>
                        <SkeletonText lineHeight={24} fontSize={16} lineSize={1} className={"w-2/3"} />
                    </View>
                )}
            </View>
            {item ? (
                <Text className="ml-9 text-sm opacity-60 leading-normal">{`${item.amount} 首歌曲`}</Text>
            ) : (
                <SkeletonText className={"ml-9 w-16"} lineHeight={21} fontSize={14} lineSize={1} />
            )}
        </>
    );

    if (grid) {
        shell = (
            <>
                {item ? (
                    <>
                        <View className={"w-full rounded-2xl bg-background-200 overflow-hidden relative"}>
                            <Image
                                source={getImageProxyUrl(item?.imgUrl ?? "")}
                                className={"w-full aspect-square"}
                            ></Image>
                            {item.source ? (
                                <>
                                    <Svg width="58" height="58" style={{ position: "absolute", right: 0, bottom: 0 }}>
                                        <Polygon points="58,0 58,58 0,58" fill={item.color} />
                                    </Svg>
                                    <View className={"absolute right-3 bottom-3 size-3 items-center justify-center"}>
                                        <Monicon name="fa6-solid:cloud" size={12} color="white" />
                                    </View>
                                </>
                            ) : null}
                        </View>
                        <Text className="text-sm flex-1 pt-2" isTruncated>
                            {item.title}
                        </Text>
                        <Text className="text-xs color-typography-400 pt-1 flex-1" isTruncated>
                            {item.amount + " 首歌曲"}
                        </Text>
                    </>
                ) : (
                    <View className={"flex-1"}>
                        <SkeletonText lineHeight={24} fontSize={16} lineSize={1} className={"w-2/3"} />
                    </View>
                )}
            </>
        );
    }

    return (
        <Pressable
            className={twMerge(grid ? "p-2 @md:p-3 flex-1" : "gap-1 px-5 py-3 flex-1", className)}
            style={style}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            {shell}
        </Pressable>
    );
}
