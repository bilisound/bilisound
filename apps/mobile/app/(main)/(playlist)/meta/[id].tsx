import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import omit from "lodash/omit";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
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
import { Input, InputField } from "~/components/ui/input";
import { Textarea, TextareaInput } from "~/components/ui/textarea";
import {
  addToPlaylist,
  clonePlaylist,
  getPlaylistMeta,
  insertPlaylistMeta,
  setPlaylistMeta,
  syncPlaylistAmount,
} from "~/storage/sqlite/playlist";
import { PlaylistDetailInsert, PlaylistMeta } from "~/storage/sqlite/schema";
import { PlaylistSource } from "~/typings/playlist";
import log from "~/utils/logger";
import { Layout } from "~/components/layout";
import { Button, ButtonOuter, ButtonText } from "~/components/ui/button";
import { useTabSafeAreaInsets } from "~/hooks/useTabSafeAreaInsets";
import { useUpdateTriggerStore } from "~/store/update-trigger";

const MAGIC_ID_NEW_ENTRY = "new";

type PlaylistMetaFrom = PlaylistMeta & { createFromQueue: boolean };

export default function Page() {
  const edgeInsets = useTabSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const tabSafeAreaEdgeInsets = useTabSafeAreaInsets();
  const { data } = useQuery({
    queryKey: [`playlist_meta_${id}`],
    queryFn: () => getPlaylistMeta(Number(id)),
  });

  const source = data?.[0]?.source ? (JSON.parse(data[0].source) as PlaylistSource) : null;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PlaylistMetaFrom>({
    defaultValues: {
      title: "",
      color:
        "#" +
        Math.floor(Math.random() * 16777216)
          .toString(16)
          .padStart(6, "0"),
      amount: 0,
    },
  });

  useEffect(() => {
    if (!data || id === MAGIC_ID_NEW_ENTRY) {
      return;
    }
    setValue("title", data[0].title);
    setValue("color", data[0].color);
    setValue("amount", data[0].amount);
    setValue("description", data[0].description);
    setValue("extendedData", data[0].extendedData);
    setValue("source", data[0].source);
    setValue("imgUrl", data[0].imgUrl);
    setValue("id", data[0].id);
  }, [data, id, setValue]);

  async function handleClone() {
    log.info("用户进行歌单克隆操作");
    try {
      const cloneId = await clonePlaylist(Number(id));
      await setPlaylistMeta({
        id: cloneId,
        source: "", // 不能是 null，否则会被 ORM 无视
      });
      await queryClient.invalidateQueries({ queryKey: ["playlist_meta"] });
      await queryClient.invalidateQueries({ queryKey: ["playlist_meta_apply"] });
      useUpdateTriggerStore.getState().incrementCount();
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

  async function onSubmit(value: PlaylistMetaFrom) {
    const isCreate = !value.id;
    let id = value.id;

    if (isCreate) {
      log.info("用户创建新的歌单");
      const result = await insertPlaylistMeta(omit(value, "createFromQueue"));
      id = result.lastInsertRowId;
    } else {
      log.info("用户编辑已有歌单");
      await setPlaylistMeta(omit(value, "createFromQueue"));
    }
    log.debug(`歌单详情：${JSON.stringify(value)}, id: ${id}`);

    if (value.createFromQueue) {
      const trackData = await Player.getTracks();
      const fromTracks: PlaylistDetailInsert[] = trackData.map(e => ({
        title: e.title ?? "",
        imgUrl: e.artworkUri ?? "",
        author: e.artist ?? "",
        bvid: e.extendedData?.id ?? "",
        duration: e.duration ?? 0,
        episode: e.extendedData?.episode ?? 1,
        playlistId: id,
      }));
      await addToPlaylist(id, fromTracks);
      await syncPlaylistAmount(id);
    }
    await queryClient.invalidateQueries({ queryKey: ["playlist_meta"] });
    await queryClient.invalidateQueries({ queryKey: ["playlist_meta_apply"] });
    await queryClient.invalidateQueries({ queryKey: [`playlist_meta_${id}`] });
    useUpdateTriggerStore.getState().incrementCount();

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
                  <Input className="flex-1">
                    <InputField
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="请输入名称"
                      className="text-sm"
                    />
                  </Input>
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
                <Textarea size="md" isReadOnly={false} isInvalid={false} isDisabled={false} className="h-48">
                  <TextareaInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ""}
                    placeholder="可以在这里设置歌单的备注"
                    className="text-sm"
                    textAlignVertical="top"
                  />
                </Textarea>
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
                <Input isDisabled>
                  <InputField value={source.originalTitle} className="text-sm text-typography-400" />
                </Input>
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
