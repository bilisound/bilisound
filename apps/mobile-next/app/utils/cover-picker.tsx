import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  Button,
  StateContent,
} from "@bilisound/ui";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { View } from "@tamagui/core";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable } from "react-native";

import { AppLayout } from "~/components/app-layout";
import { notify, reportError } from "~/components/feedback";
import { getVideoImageUrl } from "~/features/bilibili";
import { collectUniqueCoverImages, getPlaylistDetail, setPlaylistMeta } from "~/features/playlist";
import { breakpoints } from "~/constants/styles";
import { useWindowSize } from "~/hooks/useWindowSize";

/** 与 v2 相同的网格间距：首行/末行不额外留白，行间断开 4px。 */
function determinePadding(index: number, amount: number, columns: number) {
  const row = Math.floor(index / columns);
  const lastRow = Math.floor((amount - 1) / columns);

  return {
    paddingTop: row === 0 ? 0 : 2,
    paddingBottom: row === lastRow ? 0 : 2,
    paddingHorizontal: 2,
  };
}

/**
 * 歌单封面选择页，搬运自 v2 `apps/mobile/app/utils/cover-picker.tsx`。
 *
 * 图片来源与 v2 相同（只有一种）：歌单当前曲目封面的去重列表。点击图片先预览，
 * 确认后写回 `playlist_meta.imgUrl` 并刷新列表/详情缓存；也可以用「随机选择」。
 * 在 v2 的基础上补齐了加载 / 失败 / 无可选封面状态与无效编号兜底（v2 未处理），
 * 其余交互（预览确认、取消返回）保持一致。
 */
export default function CoverPickerScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const playlistId = Number(listId);
  const validId = Number.isInteger(playlistId);

  const queryClient = useQueryClient();
  const { width } = useWindowSize();

  const { data, error, isError, isPending, refetch } = useQuery({
    // 与 v2 相同的独立 query key：不复用详情页缓存，避免互相覆盖。
    queryKey: [`playlist_detail_img_picker_${listId}`],
    queryFn: () => getPlaylistDetail(playlistId),
    enabled: validId,
  });

  const images = useMemo(() => collectUniqueCoverImages(data), [data]);

  const [pickedImage, setPickedImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // 与列表页相同的可视宽度换算：>= md 时 AppShell 左侧导航占 156px，内容上限 1280。
  const sidebarWidth = width >= breakpoints.md ? 156 : 0;
  const availableWidth = Math.min(Math.max(width - sidebarWidth, 0), 1280);
  const columns = Math.max(Math.floor(availableWidth / 200), 2);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    // 直接以 URL 打开时没有可返回的页面，回退到歌单详情（v2 的等价路径）。
    router.replace(validId ? `/playlist/${playlistId}` : "/playlist");
  }

  async function handlePick() {
    try {
      await setPlaylistMeta({ id: playlistId, imgUrl: pickedImage });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });
      await queryClient.refetchQueries({ queryKey: [`playlist_meta_${listId}`] });
      notify("歌单封面修改成功");
      handleBack();
    } catch (pickError) {
      reportError(pickError);
    }
  }

  function handleClosePreview(confirmed: boolean) {
    setPreviewOpen(false);
    if (confirmed) {
      void handlePick();
    }
  }

  function handlePickRandom() {
    if (images.length === 0) {
      return;
    }
    setPickedImage(images[Math.floor(Math.random() * images.length)]);
    setPreviewOpen(true);
  }

  function renderBody() {
    if (!validId) {
      return <StateContent title="歌单不存在" description="链接中的歌单编号无效" />;
    }

    if (isPending) {
      return <StateContent title="正在加载可选封面" loading />;
    }

    if (isError) {
      return (
        <StateContent
          title="封面加载失败"
          description={error instanceof Error ? error.message : String(error)}
          onRetry={() => void refetch()}
        />
      );
    }

    if (images.length === 0) {
      return <StateContent title="没有可选的封面" description="这个歌单还没有曲目，先去添加曲目再来挑选封面" />;
    }

    return (
      <FlashList
        key={columns}
        contentContainerStyle={{ paddingHorizontal: 6 }}
        data={images}
        keyExtractor={url => url}
        numColumns={columns}
        renderItem={({ item, index }) => (
          <View flex={1} style={determinePadding(index, images.length, columns)}>
            <Pressable
              accessibilityHint="预览这张图片，确认后设为歌单封面"
              accessibilityLabel="使用这张封面"
              accessibilityRole="button"
              onPress={() => {
                setPickedImage(item);
                setPreviewOpen(true);
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: "100%" })}
            >
              <Image source={getVideoImageUrl(item)} style={{ aspectRatio: 1, width: "100%" }} contentFit="cover" />
            </Pressable>
          </View>
        )}
        style={{ flex: 1 }}
      />
    );
  }

  return (
    <AppLayout back scroll={false} title="选择歌单封面">
      <View flex={1} minWidth={0}>
        {renderBody()}
      </View>

      <View flexDirection="row" gap="$2" paddingHorizontal="$2" paddingVertical="$2">
        <Button flex={1} disabled={images.length === 0} icon="tabler:arrows-shuffle" onPress={handlePickRandom}>
          随机选择
        </Button>
        <Button flex={1} color="neutral" icon="fa6-solid:xmark" variant="ghost" onPress={handleBack}>
          取消
        </Button>
      </View>

      <AlertDialog
        open={previewOpen}
        size="md"
        onOpenChange={value => {
          if (!value) {
            setPreviewOpen(false);
          }
        }}
      >
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>预览选择的图片</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Image
                source={getVideoImageUrl(pickedImage)}
                style={{ aspectRatio: 16 / 9, borderRadius: 12, width: "100%" }}
                contentFit="cover"
              />
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button color="neutral" variant="ghost" onPress={() => handleClosePreview(false)}>
                放弃
              </Button>
              <Button onPress={() => handleClosePreview(true)}>使用这张</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    </AppLayout>
  );
}
