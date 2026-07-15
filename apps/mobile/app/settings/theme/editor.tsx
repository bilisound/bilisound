import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image as ReactNativeImage, Platform, ScrollView, View, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import Color from "colorjs.io";

import { Layout } from "~/components/layout";
import { Button, ButtonMonIcon, ButtonOuter, ButtonText } from "~/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "~/components/ui/form-control";
import { AlertCircleIcon } from "~/components/ui/icon";
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "~/components/ui/slider";
import { Text } from "~/components/ui/text";
import { TextField } from "~/components/ui-next";
import { useUiNextColors } from "~/components/ui-next/theme/colors";
import { exportThemePackage } from "~/features/theme/archive";
import { generateTailwindScale } from "~/features/theme/color-scale";
import { NativeColorPickerModal } from "~/features/theme/components/native-color-picker-modal";
import { EditorMascotBackground } from "~/features/theme/components/editor-mascot-background";
import {
  buildSavedUserTheme,
  clampYuruCharaOpacity,
  createYuruCharaRemovalDraft,
  createYuruCharaUploadDraft,
  createThemeAssetPreview,
  getYuruCharaAssetId,
  withYuruCharaDefaults,
} from "~/features/theme/editor";
import { extractThemeBaseColors } from "~/features/theme/image-colors";
import type { ExtractedThemeDebugColor } from "~/features/theme/image-colors";
import { findUserTheme, useThemeRegistry } from "~/features/theme/registry";
import { themeStorage } from "~/features/theme/storage";
import type {
  TailwindScale,
  ThemeAsset,
  UserTheme,
  YuruCharaAlign,
  YuruCharaLayout,
  YuruCharaVerticalAlign,
} from "~/features/theme/types";
import { saveBinaryFile } from "~/utils/file";

type FormValues = {
  name: string;
  primaryBase: string;
  accentBase: string;
};

type YuruCharaFormValues = {
  align: YuruCharaAlign;
  verticalAlign: YuruCharaVerticalAlign;
  originalScale: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
};

const opacityRange = { min: 0, max: 1, step: 0.005 };
const anchorGrid: {
  label: string;
  align: YuruCharaAlign;
  verticalAlign: YuruCharaVerticalAlign;
}[] = [
  { label: "左上", align: "left", verticalAlign: "top" },
  { label: "上方", align: "center", verticalAlign: "top" },
  { label: "右上", align: "right", verticalAlign: "top" },
  { label: "左侧", align: "left", verticalAlign: "center" },
  { label: "居中", align: "center", verticalAlign: "center" },
  { label: "右侧", align: "right", verticalAlign: "center" },
  { label: "左下", align: "left", verticalAlign: "bottom" },
  { label: "下方", align: "center", verticalAlign: "bottom" },
  { label: "右下", align: "right", verticalAlign: "bottom" },
];

type ThemeArchiveOutput =
  | Awaited<ReturnType<typeof exportThemePackage>>
  | {
      blob: Blob;
      mimeType: "application/zip";
      fileName: string;
    };

export default function ThemeEditorPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saveTheme = useThemeRegistry(state => state.saveTheme);
  const themes = useThemeRegistry(state => state.themes);
  const loaded = useThemeRegistry(state => state.loaded);
  const loadThemes = useThemeRegistry(state => state.loadThemes);
  const [theme, setTheme] = useState<UserTheme | null>(null);
  const [assetUri, setAssetUri] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [pendingYuruCharaAssetDeletion, setPendingYuruCharaAssetDeletion] = useState(false);
  const [pendingYuruCharaAsset, setPendingYuruCharaAsset] = useState<Omit<ThemeAsset, "themeId"> | null>(null);
  const [isMascotEditMode, setIsMascotEditMode] = useState(false);
  const mascotEditSnapshotRef = useRef<YuruCharaFormValues | null>(null);

  const defaultYuruCharas = useMemo<YuruCharaFormValues>(
    () => ({
      align: "right",
      verticalAlign: "bottom",
      originalScale: 100,
      opacity: 0.4,
      offsetX: 0,
      offsetY: 0,
    }),
    [],
  );

  const form = useForm<FormValues & YuruCharaFormValues>({
    defaultValues: {
      name: "",
      primaryBase: "#14b8a6",
      accentBase: "#3b82f6",
      ...defaultYuruCharas,
    },
  });

  const { errors } = form.formState;
  const watchedYuruChara = form.watch(["align", "verticalAlign", "originalScale", "opacity", "offsetX", "offsetY"]);

  const enterMascotEditMode = useCallback(() => {
    mascotEditSnapshotRef.current = {
      align: form.getValues("align"),
      verticalAlign: form.getValues("verticalAlign"),
      originalScale: form.getValues("originalScale"),
      opacity: form.getValues("opacity"),
      offsetX: form.getValues("offsetX"),
      offsetY: form.getValues("offsetY"),
    };
    setIsMascotEditMode(true);
  }, [form]);

  const cancelMascotEditMode = useCallback(() => {
    const snapshot = mascotEditSnapshotRef.current;
    if (snapshot) {
      form.setValue("align", snapshot.align);
      form.setValue("verticalAlign", snapshot.verticalAlign);
      form.setValue("originalScale", snapshot.originalScale);
      form.setValue("opacity", snapshot.opacity);
      form.setValue("offsetX", snapshot.offsetX);
      form.setValue("offsetY", snapshot.offsetY);
      mascotEditSnapshotRef.current = null;
    }
    setIsMascotEditMode(false);
  }, [form]);

  const saveMascotEditMode = useCallback(() => {
    mascotEditSnapshotRef.current = null;
    setIsMascotEditMode(false);
  }, []);

  const resetMascotEdit = useCallback(() => {
    form.setValue("offsetX", 0);
    form.setValue("offsetY", 0);
    form.setValue("originalScale", 100);
  }, [form]);

  const handleMascotChange = useCallback(
    (patch: Partial<YuruCharaLayout>) => {
      if (patch.offsetX !== undefined) form.setValue("offsetX", patch.offsetX, { shouldValidate: false });
      if (patch.offsetY !== undefined) form.setValue("offsetY", patch.offsetY, { shouldValidate: false });
      if (patch.originalScale !== undefined)
        form.setValue("originalScale", patch.originalScale, { shouldValidate: false });
    },
    [form],
  );

  const previewLayout = useMemo(() => {
    if (!theme?.yuruChara) return null;
    const [align, verticalAlign, originalScale, opacity, offsetX, offsetY] = watchedYuruChara;
    return withYuruCharaDefaults(theme, {
      align: align as YuruCharaAlign,
      verticalAlign: verticalAlign as YuruCharaVerticalAlign,
      originalScale: originalScale as number,
      opacity: opacity as number,
      offsetX: offsetX as number,
      offsetY: offsetY as number,
    });
  }, [theme, watchedYuruChara]);

  useEffect(() => {
    if (!loaded) loadThemes();
  }, [loadThemes, loaded]);

  useEffect(() => {
    let active = true;
    let disposeAssetPreview: () => void = () => undefined;
    const existing = id ? findUserTheme(themes, id) : null;
    if (existing) {
      setTheme(existing);
      setExtractedColors(existing.yuruChara?.extractedColors ?? []);
      setPendingYuruCharaAssetDeletion(false);
      setPendingYuruCharaAsset(null);
      form.reset({
        name: existing.name,
        primaryBase: existing.palette.primary["500"],
        accentBase: existing.palette.accent["500"],
        align: existing.yuruChara?.align ?? defaultYuruCharas.align,
        verticalAlign: existing.yuruChara?.verticalAlign ?? defaultYuruCharas.verticalAlign,
        originalScale: existing.yuruChara?.originalScale ?? defaultYuruCharas.originalScale,
        opacity: existing.yuruChara?.opacity ?? defaultYuruCharas.opacity,
        offsetX: existing.yuruChara?.offsetX ?? defaultYuruCharas.offsetX,
        offsetY: existing.yuruChara?.offsetY ?? defaultYuruCharas.offsetY,
      });
      themeStorage.getThemeAsset(existing).then(asset => {
        const preview = createThemeAssetPreview(asset);
        if (!active) {
          preview.dispose();
          return;
        }
        disposeAssetPreview();
        disposeAssetPreview = preview.dispose;
        setAssetUri(preview.uri);
      });
    } else {
      setTheme(null);
      setAssetUri(null);
      setExtractedColors([]);
      setPendingYuruCharaAssetDeletion(false);
      setPendingYuruCharaAsset(null);
    }
    return () => {
      active = false;
      disposeAssetPreview();
    };
  }, [id, themes, form, defaultYuruCharas]);

  if (!theme) {
    return (
      <Layout title="编辑主题" leftAccessories="BACK_BUTTON">
        <Text className="p-4">{loaded ? "主题不存在" : "正在加载主题..."}</Text>
      </Layout>
    );
  }

  const extractedColorCandidates = extractedColors;

  function swapBaseColors() {
    const primaryBase = form.getValues("primaryBase");
    const accentBase = form.getValues("accentBase");
    form.setValue("primaryBase", accentBase, { shouldDirty: true });
    form.setValue("accentBase", primaryBase, { shouldDirty: true });
  }

  async function pickImage() {
    const pickResult = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "image/webp"] });
    const asset = pickResult.assets?.[0];
    if (!asset?.uri || !theme) return;

    try {
      const colors = await extractThemeBaseColors(
        Platform.OS === "web" ? ({ file: asset.file as File } as never) : ({ uri: asset.uri } as never),
      );
      const imageSize = await getPickedImageSize(asset);
      const nextExtractedColors = getUniqueDebugColorValues(colors.debugColors ?? []);
      const nextAsset: Omit<ThemeAsset, "themeId"> = {
        // Expo Image ignores custom cache keys for local Android files, so replacements need a new URI.
        id: getYuruCharaAssetId(theme.id, Date.now()),
        fileName: asset.name ?? "yuru-chara.png",
        mimeType: (asset.mimeType as "image/jpeg" | "image/png" | "image/webp") ?? "image/png",
        uri: asset.uri,
        blob: Platform.OS === "web" ? ((asset.file as File) ?? undefined) : undefined,
      };
      form.setValue("primaryBase", colors.primaryBase);
      form.setValue("accentBase", colors.accentBase);
      form.setValue("originalScale", 100);
      setExtractedColors(nextExtractedColors);
      setPendingYuruCharaAssetDeletion(false);
      setPendingYuruCharaAsset(nextAsset);
      setAssetUri(asset.uri);
      setTheme(
        createYuruCharaUploadDraft(theme, {
          assetId: nextAsset.id,
          imageSize,
          extractedColors: nextExtractedColors,
        }),
      );
    } catch {
      Toast.show({ type: "error", text1: "图片处理失败", text2: "无法读取图片颜色或处理图片" });
    }
  }

  async function handleSubmit(values: FormValues & YuruCharaFormValues) {
    if (!theme) return;
    try {
      const updated = buildSavedUserTheme(theme, {
        name: values.name,
        primaryBase: values.primaryBase,
        accentBase: values.accentBase,
        updatedAt: Date.now(),
      });
      if (theme.yuruChara) {
        updated.yuruChara = withYuruCharaDefaults(theme, {
          align: values.align,
          verticalAlign: values.verticalAlign,
          originalScale: values.originalScale,
          opacity: values.opacity,
          offsetX: values.offsetX,
          offsetY: values.offsetY,
        });
      } else if (pendingYuruCharaAssetDeletion) {
        await themeStorage.deleteThemeAsset(theme.id);
      }
      await saveTheme(updated, pendingYuruCharaAsset ?? undefined);
      setTheme(updated);
      setPendingYuruCharaAssetDeletion(false);
      setPendingYuruCharaAsset(null);
      Toast.show({ type: "success", text1: "主题已保存", text2: updated.name });
    } catch {
      Toast.show({ type: "error", text1: "主题保存失败", text2: "请检查颜色输入是否有效" });
    }
  }

  async function deleteYuruCharaImage() {
    if (!theme?.yuruChara) return;
    setTheme(createYuruCharaRemovalDraft(theme));
    setAssetUri(null);
    setExtractedColors([]);
    setPendingYuruCharaAssetDeletion(true);
    setPendingYuruCharaAsset(null);
  }

  async function exportTheme() {
    if (!theme) return;
    try {
      const asset = await themeStorage.getThemeAsset(theme);
      const output = (await exportThemePackage(theme, asset ?? undefined)) as ThemeArchiveOutput;
      if ("uri" in output) {
        await saveBinaryFile(output.uri, output.mimeType, output.fileName);
      } else if (Platform.OS === "web") {
        const url = URL.createObjectURL(output.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = output.fileName;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Theme export did not return a native file uri");
      }
      Toast.show({ type: "success", text1: "主题已导出", text2: theme.name });
    } catch {
      Toast.show({ type: "error", text1: "主题导出失败", text2: "无法生成主题包" });
    }
  }

  return (
    <Layout title="编辑主题" leftAccessories={isMascotEditMode ? null : "BACK_BUTTON"}>
      <View className="flex-1 relative">
        <EditorMascotBackground
          layout={previewLayout ?? theme.yuruChara}
          uri={assetUri}
          editable={isMascotEditMode}
          onChange={handleMascotChange}
          onCancel={cancelMascotEditMode}
          onReset={resetMascotEdit}
          onDone={saveMascotEditMode}
        />
        {!isMascotEditMode ? (
          <ScrollView className="flex-1 z-[1]" contentContainerClassName="p-4">
            <View className="gap-8 md:flex-row md:items-start">
              <View className="md:flex-1">
                <Text className="text-lg font-bold mb-4">基础</Text>
                <Controller
                  control={form.control}
                  name="name"
                  rules={{ required: "请输入主题名称" }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <View className="mb-4">
                      <FormControl isRequired isInvalid={!!error}>
                        <FormControlLabel>
                          <FormControlLabelText className="text-sm">主题名称</FormControlLabelText>
                        </FormControlLabel>
                        <TextField
                          accessibilityLabel="主题名称"
                          placeholder="请输入主题名称"
                          size="md"
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          invalid={!!error}
                        />
                        <FormControlError>
                          <FormControlErrorIcon as={AlertCircleIcon} />
                          <FormControlErrorText size="sm">{error?.message}</FormControlErrorText>
                        </FormControlError>
                      </FormControl>
                    </View>
                  )}
                />

                <Controller
                  control={form.control}
                  name="primaryBase"
                  render={({ field: { value } }) => (
                    <View className="mb-4">
                      <ColorPickerField
                        title="Primary 主色"
                        value={value}
                        fallback={theme.palette.primary}
                        colorCandidates={extractedColorCandidates}
                        onChange={next => form.setValue("primaryBase", next)}
                      />
                    </View>
                  )}
                />

                <View className="mb-4">
                  <ButtonOuter>
                    <Button action="secondary" onPress={swapBaseColors}>
                      <ButtonMonIcon name="tabler:repeat" />
                      <ButtonText>交换主色与强调色</ButtonText>
                    </Button>
                  </ButtonOuter>
                </View>

                <Controller
                  control={form.control}
                  name="accentBase"
                  render={({ field: { value } }) => (
                    <View className="mb-4">
                      <ColorPickerField
                        title="Accent 强调色"
                        value={value}
                        fallback={theme.palette.accent}
                        colorCandidates={extractedColorCandidates}
                        onChange={next => form.setValue("accentBase", next)}
                      />
                    </View>
                  )}
                />
              </View>

              <View className="md:flex-1">
                <Text className="text-lg font-bold mb-4">看板娘</Text>
                <View className="mb-4">
                  <ButtonOuter>
                    <Button action="primary" onPress={pickImage}>
                      <ButtonText>上传 / 替换图片并自动取色</ButtonText>
                    </Button>
                  </ButtonOuter>
                </View>

                {assetUri ? (
                  <>
                    <View className="mb-4 gap-4">
                      <ButtonOuter>
                        <Button action="primary" onPress={enterMascotEditMode}>
                          <ButtonMonIcon name="fa6-solid:arrows-up-down-left-right" />
                          <ButtonText>调整位置和大小</ButtonText>
                        </Button>
                      </ButtonOuter>
                      <ButtonOuter>
                        <Button action="negative" onPress={deleteYuruCharaImage}>
                          <ButtonMonIcon name="fa6-solid:trash" />
                          <ButtonText>删除看板娘图片</ButtonText>
                        </Button>
                      </ButtonOuter>
                    </View>
                    <Controller
                      control={form.control}
                      name="align"
                      render={({ field: { value: align } }) => (
                        <View className="mb-4">
                          <Controller
                            control={form.control}
                            name="verticalAlign"
                            render={({ field: { value: verticalAlign } }) => (
                              <FormControl>
                                <FormControlLabel>
                                  <FormControlLabelText className="text-sm">图片位置锚点</FormControlLabelText>
                                </FormControlLabel>
                                <AnchorGrid
                                  align={align}
                                  verticalAlign={verticalAlign}
                                  onSelect={(newAlign, newVerticalAlign) => {
                                    form.setValue("align", newAlign);
                                    form.setValue("verticalAlign", newVerticalAlign);
                                  }}
                                />
                              </FormControl>
                            )}
                          />
                        </View>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="opacity"
                      render={({ field: { value, onChange } }) => <OpacitySlider value={value} onChange={onChange} />}
                    />
                  </>
                ) : null}
              </View>
            </View>
          </ScrollView>
        ) : null}
      </View>
      {!isMascotEditMode ? (
        <View className="p-4 pt-2">
          <View className="flex-row gap-3">
            <ButtonOuter className="flex-1">
              <Button className="gap-3" onPress={form.handleSubmit(handleSubmit)} disabled={!!errors.name}>
                <ButtonMonIcon name={"fa6-solid:floppy-disk"} />
                <ButtonText>保存</ButtonText>
              </Button>
            </ButtonOuter>
            <ButtonOuter className="flex-1">
              <Button className="gap-3" onPress={exportTheme}>
                <ButtonMonIcon name={"fa6-solid:share"} />
                <ButtonText>导出</ButtonText>
              </Button>
            </ButtonOuter>
          </View>
        </View>
      ) : null}
    </Layout>
  );
}

function ColorPickerField({
  title,
  value,
  fallback,
  colorCandidates,
  onChange,
}: {
  title: string;
  value: string;
  fallback: TailwindScale;
  colorCandidates: string[];
  onChange: (value: string) => void;
}) {
  const parsed = parseColorForPicker(value, fallback["500"]);
  const scale = safeGenerateTailwindScale(value, fallback);
  const [nativePickerVisible, setNativePickerVisible] = useState(false);
  const [nativeDraftColor, setNativeDraftColor] = useState(parsed.hex);

  function openNativePicker() {
    setNativeDraftColor(parsed.hex);
    setNativePickerVisible(true);
  }

  function confirmNativePicker() {
    onChange(normalizeHex(nativeDraftColor, parsed.hex));
    setNativePickerVisible(false);
  }

  return (
    <FormControl>
      <FormControlLabel>
        <FormControlLabelText className="text-sm">{title}</FormControlLabelText>
      </FormControlLabel>
      <FormControlHelperText className="text-xs text-typography-500">
        {Platform.OS === "web" ? "点击色块调用浏览器 / 系统调色板" : "点击色块打开调色板，确定后应用"}
      </FormControlHelperText>
      <View className="flex-row items-center gap-3 mt-1.5">
        {Platform.OS === "web" ? (
          <WebColorInput title={title} value={parsed.hex} onChange={onChange} />
        ) : (
          <Pressable
            accessibilityLabel={`打开 ${title} 调色板`}
            accessibilityRole="button"
            className="w-10 h-10 rounded border border-background-300"
            style={{ backgroundColor: parsed.hex }}
            onPress={openNativePicker}
          />
        )}
        <TextField
          accessibilityLabel={`${title} Hex 值`}
          placeholder="Hex（可选）"
          size="md"
          value={value}
          onChangeText={onChange}
          containerStyle={{ width: 120, flexShrink: 0 }}
        />
      </View>
      <ExtractedColorGrid colors={colorCandidates} value={parsed.hex} onSelect={onChange} />
      <ScalePreview scale={scale} />
      {Platform.OS === "web" ? null : (
        <NativeColorPickerModal
          title={title}
          visible={nativePickerVisible}
          value={nativeDraftColor}
          onChange={setNativeDraftColor}
          onCancel={() => setNativePickerVisible(false)}
          onConfirm={confirmNativePicker}
        />
      )}
    </FormControl>
  );
}

function WebColorInput({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { colorValue } = useUiNextColors();
  return React.createElement("input", {
    "aria-label": `${title} color picker`,
    type: "color",
    className: "theme-color-swatch",
    value,
    onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value),
    style: {
      width: 40,
      height: 40,
      padding: 0,
      border: `1px solid ${colorValue("--color-background-300")}`,
      borderRadius: 4,
      backgroundColor: "transparent",
      cursor: "pointer",
    },
  });
}

function ExtractedColorGrid({
  colors,
  value,
  onSelect,
}: {
  colors: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  if (colors.length === 0) return null;

  return (
    <View className="gap-1.5 mt-2">
      <FormControlHelperText className="text-xs text-typography-500">从图片提取的颜色</FormControlHelperText>
      <View className="flex-row flex-wrap gap-2">
        {colors.map(color => {
          const selected = normalizeHex(color, color) === value;
          return (
            <Pressable
              key={color}
              accessibilityLabel={`选择颜色 ${color}`}
              className={`size-12 flex-row items-center justify-center border rounded-[16px] ${
                selected ? "border-primary-500 bg-primary-100" : "border-background-200"
              }`}
              onPress={() => onSelect(color)}
            >
              <View className="size-8 rounded-[8px]" style={{ backgroundColor: color }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ScalePreview({ scale }: { scale: TailwindScale }) {
  return (
    <View className="flex-row h-8 overflow-hidden rounded-lg mt-3">
      {Object.entries(scale).map(([shade, color]) => (
        <View key={shade} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </View>
  );
}

const horizontalClassNames: Record<YuruCharaAlign, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};

const verticalClassNames: Record<YuruCharaVerticalAlign, string> = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
};

function AnchorGrid({
  align,
  verticalAlign,
  onSelect,
}: {
  align: YuruCharaAlign;
  verticalAlign: YuruCharaVerticalAlign;
  onSelect: (align: YuruCharaAlign, verticalAlign: YuruCharaVerticalAlign) => void;
}) {
  return (
    <View className="flex-row flex-wrap border border-background-300 rounded-2xl pl-2 pt-2 gap-2 w-[178px] h-[178px]">
      {anchorGrid.map(item => {
        const selected = item.align === align && item.verticalAlign === verticalAlign;
        return (
          <Pressable
            key={`${item.align}-${item.verticalAlign}`}
            accessibilityLabel={`图片位置锚点：${item.label}`}
            className={`w-12 h-12 rounded-xl p-2 ${horizontalClassNames[item.align]} ${verticalClassNames[item.verticalAlign]} ${
              selected ? "bg-primary-100" : "bg-background-100"
            }`}
            onPress={() => onSelect(item.align, item.verticalAlign)}
          >
            <View className="size-4 items-center justify-center">
              <View
                className={selected ? "size-4 rounded-full bg-primary-500" : "size-2.5 rounded-full bg-background-400"}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function OpacitySlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const displayValue = clampYuruCharaOpacity(value);

  return (
    <FormControl>
      <FormControlLabel>
        <FormControlLabelText className="text-sm">透明度</FormControlLabelText>
      </FormControlLabel>
      <View className="flex-row items-center justify-between mt-0.5">
        <View className="flex-row justify-end">
          <Text className="text-xs text-typography-500">{formatOpacityPercent(displayValue)}%</Text>
        </View>
      </View>
      <View className="mt-2">
        <Slider
          size="md"
          orientation="horizontal"
          value={displayValue}
          minValue={opacityRange.min}
          maxValue={opacityRange.max}
          step={opacityRange.step}
          onChange={next => onChange(clampYuruCharaOpacity(next))}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </View>
    </FormControl>
  );
}

async function getPickedImageSize(
  asset: DocumentPicker.DocumentPickerAsset,
): Promise<{ width: number; height: number }> {
  if (Platform.OS === "web" && asset.file) {
    return getWebImageSize(asset.file);
  }

  return new Promise((resolve, reject) => {
    ReactNativeImage.getSize(asset.uri, (width, height) => resolve({ width, height }), reject);
  });
}

function getWebImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = error => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });
}

function safeGenerateTailwindScale(baseColor: string, fallback: TailwindScale) {
  try {
    return generateTailwindScale(baseColor);
  } catch {
    return fallback;
  }
}

function parseColorForPicker(value: string, fallback: string) {
  const hex = normalizeHex(value, fallback);
  return { hex };
}

function normalizeHex(value: string, fallback: string) {
  try {
    return new Color(value).to("srgb").toString({ format: "hex" });
  } catch {
    return fallback;
  }
}

function formatOpacityPercent(value: number) {
  return String(Math.round(value * 1000) / 10);
}

function getUniqueDebugColorValues(colors: ExtractedThemeDebugColor[]) {
  const seen = new Set<string>();
  return colors.flatMap(item => {
    const color = normalizeHex(item.color, item.color);
    if (seen.has(color)) return [];
    seen.add(color);
    return [color];
  });
}
