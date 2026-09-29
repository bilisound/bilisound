import { Button, Checkbox, Label, LabelError, StateContent, TextArea, TextInput } from "@bilisound/ui";
import { View } from "@tamagui/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AppLayout } from "~/components/app-layout";
import { notify, reportError } from "~/components/feedback";
import {
  addToPlaylist,
  clonePlaylist,
  getPlaylistMeta,
  insertPlaylistMeta,
  setPlaylistMeta,
  syncPlaylistAmount,
  type PlayableItem,
  type PlaylistCreateInput,
} from "~/features/playlist";
import * as Player from "~/features/player";
import log from "~/utils/logger";

const MAGIC_ID_NEW_ENTRY = "new";

type PlaylistMetaForm = PlaylistCreateInput & { id?: number; createFromQueue: boolean };

function randomPlaylistColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777216)
      .toString(16)
      .padStart(6, "0")
  );
}

/**
 * 歌单元数据编辑页（新建 / 修改），搬运自 v2
 * `apps/mobile/app/(main)/(playlist)/meta/[id].tsx`。
 *
 * 保留:标题（含在线歌单原名称还原）、备注、颜色（新建随机生成、编辑保持原值）、
 * 从当前队列创建、在线歌单解绑副本、保存后的列表/详情缓存刷新。
 */
export default function PlaylistMetaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isNew = id === MAGIC_ID_NEW_ENTRY;

  const { data, error, isError, isPending, refetch } = useQuery({
    queryKey: [`playlist_meta_${id}`],
    queryFn: () => getPlaylistMeta(Number(id)),
    enabled: !!id && !isNew,
  });

  const source = data?.source ?? null;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PlaylistMetaForm>({
    defaultValues: {
      title: "",
      color: randomPlaylistColor(),
      createFromQueue: false,
    },
  });

  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    if (!data || isNew) {
      return;
    }
    setValue("title", data.title);
    setValue("color", data.color);
    setValue("description", data.description);
    setValue("extendedData", data.extendedData);
    setValue("source", data.source);
    setValue("imgUrl", data.imgUrl);
    setValue("filterRules", data.filterRules);
    setValue("id", data.id);
  }, [data, isNew, setValue]);

  async function handleClone() {
    if (cloning || !id) {
      return;
    }
    setCloning(true);
    try {
      log.info("用户进行歌单克隆操作");
      const cloneId = await clonePlaylist(Number(id));
      await setPlaylistMeta({ id: cloneId, source: null });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });
      notify("歌单副本创建成功");
      router.back();
    } catch (cloneError) {
      reportError(cloneError);
    } finally {
      setCloning(false);
    }
  }

  async function onSubmit(value: PlaylistMetaForm) {
    if (saving) {
      return;
    }
    setSaving(true);
    const { createFromQueue, id: existingId, ...playlist } = value;

    try {
      let playlistId: number;
      let created = false;

      if (existingId === undefined) {
        log.info("用户创建新的歌单");
        const result = await insertPlaylistMeta(playlist);
        playlistId = result.lastInsertRowId;
        created = true;
      } else {
        log.info("用户编辑已有歌单");
        playlistId = existingId;
        await setPlaylistMeta({ id: playlistId, ...playlist });
      }
      log.debug(`歌单详情：${JSON.stringify(value)}, id: ${playlistId}`);

      if (createFromQueue) {
        const trackData = await Player.getTracks();
        const fromTracks: PlayableItem[] = trackData.map(track => ({
          title: track.title ?? "",
          imgUrl: track.extendedData?.artworkUrl ?? track.artworkUri ?? "",
          author: track.artist ?? "",
          bvid: track.extendedData?.id ?? "",
          duration: track.duration ?? 0,
          episode: track.extendedData?.episode ?? 1,
        }));
        await addToPlaylist(playlistId, fromTracks);
        await syncPlaylistAmount(playlistId);
      }

      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });
      await queryClient.refetchQueries({ queryKey: [`playlist_meta_${playlistId}`] });

      notify(created ? `歌单创建成功：${value.title}` : "歌单修改成功");
      router.back();
    } catch (submitError) {
      reportError(submitError);
    } finally {
      setSaving(false);
    }
  }

  function renderBody() {
    if (!id) {
      return <StateContent title="正在加载歌单信息" loading />;
    }

    if (!isNew) {
      if (isPending) {
        return <StateContent title="正在加载歌单信息" loading />;
      }
      if (isError) {
        return (
          <StateContent
            title="歌单信息加载失败"
            description={error instanceof Error ? error.message : String(error)}
            onRetry={() => void refetch()}
          />
        );
      }
      if (data === null) {
        return <StateContent title="歌单不存在" description="该歌单可能已被删除" />;
      }
    }

    return (
      <View padding="$4" gap="$5" paddingBottom={32}>
        <View gap="$1">
          <Label required>歌单名称</Label>
          <Controller
            control={control}
            name="title"
            rules={{ required: "请输入名称" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View flexDirection="row" gap="$3" alignItems="flex-start">
                <View flex={1} minWidth={0}>
                  <TextInput
                    accessibilityHint="输入歌单显示名称"
                    accessibilityLabel="歌单名称"
                    invalid={"title" in errors}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="请输入名称"
                    value={value}
                  />
                </View>
                {source ? (
                  <Button disabled={source.originalTitle === value} onPress={() => onChange(source.originalTitle)}>
                    还原
                  </Button>
                ) : null}
              </View>
            )}
          />
          {"title" in errors ? <LabelError>{errors.title?.message}</LabelError> : null}
        </View>

        <View gap="$1">
          <Label>备注</Label>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextArea
                accessibilityHint="输入歌单备注信息"
                accessibilityLabel="备注"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="可以在这里设置歌单的备注"
                rows={8}
                value={value ?? ""}
              />
            )}
          />
        </View>

        {source ? (
          <View gap="$2">
            <Label>绑定在线歌单</Label>
            <TextInput accessibilityLabel="绑定在线歌单" disabled value={source.originalTitle} />
            <Button alignSelf="stretch" disabled={cloning} onPress={() => void handleClone()}>
              {cloning ? "正在创建副本……" : "创建解绑副本"}
            </Button>
          </View>
        ) : null}

        {isNew ? (
          <Controller
            control={control}
            name="createFromQueue"
            render={({ field: { onChange, value } }) => (
              <Checkbox checked={!!value} label="从当前队列创建歌单" onCheckedChange={onChange} />
            )}
          />
        ) : null}

        <Button alignSelf="stretch" disabled={saving || !!errors.title} onPress={handleSubmit(onSubmit)}>
          {saving ? "正在保存……" : "保存"}
        </Button>
      </View>
    );
  }

  return (
    <AppLayout back title={isNew ? "新建歌单" : "修改歌单信息"}>
      {renderBody()}
    </AppLayout>
  );
}
