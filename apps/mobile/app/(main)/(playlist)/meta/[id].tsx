import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import * as Player from "@bilisound/player";

import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "~/components/ui/checkbox";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "~/components/ui/form-control";
import { AlertCircleIcon, CheckIcon } from "~/components/ui/icon";
import { TextareaField, TextField } from "~/components/ui-next";
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
import log from "~/utils/logger";
import { Layout } from "~/components/layout";
import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { useTabSafeAreaInsets } from "~/hooks/useTabSafeAreaInsets";

const MAGIC_ID_NEW_ENTRY = "new";

type PlaylistMetaForm = PlaylistCreateInput & { id?: number; createFromQueue: boolean };

export default function Page() {
  const edgeInsets = useTabSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const tabSafeAreaEdgeInsets = useTabSafeAreaInsets();
  const { data } = useQuery({
    queryKey: [`playlist_meta_${id}`],
    queryFn: () => getPlaylistMeta(Number(id)),
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
      color:
        "#" +
        Math.floor(Math.random() * 16777216)
          .toString(16)
          .padStart(6, "0"),
      createFromQueue: false,
    },
  });

  useEffect(() => {
    if (!data || id === MAGIC_ID_NEW_ENTRY) {
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
  }, [data, id, setValue]);

  async function handleClone() {
    log.info("用户进行歌单克隆操作");
    try {
      const cloneId = await clonePlaylist(Number(id));
      await setPlaylistMeta({
        id: cloneId,
        source: null,
      });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta"] });
      await queryClient.refetchQueries({ queryKey: ["playlist_meta_apply"] });
      Toast.show({
        type: "success",
        text1: "歌单副本创建成功",
      });
      router.back();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "歌单副本创建失败",
      });
      log.error("歌单克隆失败：" + err);
    }
  }

  async function onSubmit(value: PlaylistMetaForm) {
    const { createFromQueue, id: existingId, ...playlist } = value;
    const isCreate = existingId === undefined;
    let playlistId: number;

    if (existingId === undefined) {
      log.info("用户创建新的歌单");
      const result = await insertPlaylistMeta(playlist);
      playlistId = result.lastInsertRowId;
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

    if (isCreate) {
      Toast.show({
        type: "success",
        text1: "歌单创建成功",
        text2: "新歌单的名称：" + value.title,
      });
    } else {
      Toast.show({
        type: "success",
        text1: "歌单修改成功",
      });
    }
    router.back();
  }

  return (
    <Layout
      title={id === MAGIC_ID_NEW_ENTRY ? "新建歌单" : "修改歌单信息"}
      leftAccessories="BACK_BUTTON"
      edgeInsets={{ ...tabSafeAreaEdgeInsets, bottom: 0 }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: edgeInsets.bottom,
        }}
        scrollIndicatorInsets={{
          bottom: Number.MIN_VALUE,
        }}
      >
        <View className="p-4 gap-4" style={{ paddingBottom: Math.max(edgeInsets.bottom, 16) }}>
          {/*<View className={"h-[400px] w-16 bg-yellow-500"}></View>*/}
          <FormControl isRequired isInvalid={"title" in errors}>
            <FormControlLabel>
              <FormControlLabelText className="text-sm">歌单名称</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row w-full gap-3">
                  <TextField
                    accessibilityHint="输入歌单显示名称"
                    accessibilityLabel="歌单名称"
                    containerStyle={styles.titleInput}
                    inputStyle={styles.textInputSmall}
                    invalid={"title" in errors}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="请输入名称"
                    size="md"
                    value={value}
                  />
                  {source ? (
                    <ButtonOuter className="flex-0 basis-auto">
                      <Button
                        onPress={() => {
                          onChange(source?.originalTitle);
                        }}
                        disabled={source?.originalTitle === value}
                      >
                        <ButtonText>还原</ButtonText>
                      </Button>
                    </ButtonOuter>
                  ) : null}
                </View>
              )}
              name="title"
              rules={{ required: "请输入名称" }}
            />
            <FormControlError>
              <FormControlErrorIcon as={AlertCircleIcon} />
              <FormControlErrorText size="sm">{errors.title?.message}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          <FormControl isInvalid={"description" in errors}>
            <FormControlLabel>
              <FormControlLabelText className="text-sm">备注</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextareaField
                  accessibilityHint="输入歌单备注信息"
                  accessibilityLabel="备注"
                  containerStyle={styles.descriptionInput}
                  inputStyle={styles.textInputSmall}
                  invalid={"description" in errors}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="可以在这里设置歌单的备注"
                  size="md"
                  value={value ?? ""}
                />
              )}
              name="description"
            />
            <FormControlError>
              <FormControlErrorIcon as={AlertCircleIcon} />
              <FormControlErrorText size="sm">{errors.title?.message}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          {source ? (
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-sm">绑定在线歌单</FormControlLabelText>
              </FormControlLabel>
              <View className="gap-4">
                <TextField
                  accessibilityLabel="绑定在线歌单"
                  containerStyle={styles.boundPlaylistInput}
                  disabled
                  inputStyle={styles.textInputSmall}
                  size="md"
                  value={source.originalTitle}
                />
                <ButtonOuter>
                  <Button onPress={() => handleClone()}>
                    <ButtonText>创建解绑副本</ButtonText>
                  </Button>
                </ButtonOuter>
              </View>
            </FormControl>
          ) : null}

          {id === MAGIC_ID_NEW_ENTRY && (
            <FormControl>
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    onChange={onChange}
                    isChecked={!!value}
                    value={String(value)}
                    aria-label="从当前队列创建歌单"
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                    <CheckboxLabel className="text-sm">从当前队列创建歌单</CheckboxLabel>
                  </Checkbox>
                )}
                name="createFromQueue"
                defaultValue={false}
              />
            </FormControl>
          )}
          <ButtonOuter>
            <Button variant="solid" onPress={handleSubmit(onSubmit)} disabled={!!errors.title}>
              <ButtonText>保存</ButtonText>
            </Button>
          </ButtonOuter>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    flex: 1,
  },
  boundPlaylistInput: {
    borderRadius: 4,
  },
  descriptionInput: {
    height: 192,
  },
  textInputSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
});
