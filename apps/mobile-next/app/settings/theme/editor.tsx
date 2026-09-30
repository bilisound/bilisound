import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Image as ReactNativeImage, Platform, StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";

import { Button, HStack, Slider, StateContent, Text, TextInput, VStack } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";
import { notify } from "~/components/feedback";
import { formatOpacityPercent } from "~/components/settings-format";
import { SettingsColorPicker } from "~/components/settings-color-picker";
import { SettingsSectionTitle } from "~/components/settings-menu";
import { exportUserTheme } from "~/components/settings-theme-file";
import {
  OFFSET_SLIDER_LIMIT,
  SCALE_LIMIT,
  getOffsetSliderValue,
  resolveScaleEntry,
} from "~/components/theme-editor-input";
import { NumberEntry } from "~/components/theme-editor-number-entry";
import { generateTailwindScale } from "~/features/theme/color-scale";
import {
  buildSavedUserTheme,
  clampYuruCharaOpacity,
  createThemeAssetPreview,
  createYuruCharaRemovalDraft,
  createYuruCharaUploadDraft,
  getYuruCharaAssetId,
  getMinOriginalScaleForOnePixel,
  getYuruCharaRenderMetrics,
  withYuruCharaDefaults,
} from "~/features/theme/editor";
import { extractThemeBaseColors } from "~/features/theme/image-colors";
import { hexFromCssColor } from "~/features/theme/package-schema";
import { findUserTheme, useThemeRegistry } from "~/features/theme/registry";
import { themeStorage } from "~/features/theme/storage";
import type {
  TailwindScale,
  ThemeAsset,
  UserTheme,
  YuruCharaAlign,
  YuruCharaVerticalAlign,
} from "~/features/theme/types";
import { useWindowSize } from "~/hooks/useWindowSize";
import log from "~/utils/logger";

interface YuruCharaForm {
  align: YuruCharaAlign;
  verticalAlign: YuruCharaVerticalAlign;
  originalScale: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
}

const defaultYuruChara: YuruCharaForm = {
  align: "right",
  verticalAlign: "bottom",
  originalScale: 100,
  opacity: 0.4,
  offsetX: 0,
  offsetY: 0,
};

const anchorGrid: { label: string; align: YuruCharaAlign; verticalAlign: YuruCharaVerticalAlign }[] = [
  { align: "left", label: "左上", verticalAlign: "top" },
  { align: "center", label: "上方", verticalAlign: "top" },
  { align: "right", label: "右上", verticalAlign: "top" },
  { align: "left", label: "左侧", verticalAlign: "center" },
  { align: "center", label: "居中", verticalAlign: "center" },
  { align: "right", label: "右侧", verticalAlign: "center" },
  { align: "left", label: "左下", verticalAlign: "bottom" },
  { align: "center", label: "下方", verticalAlign: "bottom" },
  { align: "right", label: "右下", verticalAlign: "bottom" },
];

export default function ThemeEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewportSize = useWindowSize();
  const themes = useThemeRegistry(state => state.themes);
  const loaded = useThemeRegistry(state => state.loaded);
  const loadThemes = useThemeRegistry(state => state.loadThemes);
  const saveTheme = useThemeRegistry(state => state.saveTheme);

  const [theme, setTheme] = useState<UserTheme | null>(null);
  const [name, setName] = useState("");
  const [primaryBase, setPrimaryBase] = useState("#14b8a6");
  const [accentBase, setAccentBase] = useState("#3b82f6");
  const [yuruChara, setYuruChara] = useState<YuruCharaForm>(defaultYuruChara);
  const [assetUri, setAssetUri] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [pendingAsset, setPendingAsset] = useState<Omit<ThemeAsset, "themeId"> | null>(null);
  const [pendingAssetDeletion, setPendingAssetDeletion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedImageSize, setLoadedImageSize] = useState<{ width: number; height: number } | null>(null);
  const [positionEditing, setPositionEditing] = useState(false);
  const positionSnapshotRef = useRef<YuruCharaForm | null>(null);

  useEffect(() => {
    if (!loaded) {
      void loadThemes();
    }
  }, [loadThemes, loaded]);

  useEffect(() => {
    let active = true;
    let disposeAssetPreview: () => void = () => undefined;
    const existing = id ? findUserTheme(themes, id) : null;
    if (!existing) {
      if (loaded) {
        setTheme(null);
      }
      return;
    }

    setTheme(existing);
    setName(existing.name);
    setPrimaryBase(safeHex(existing.palette.primaryBase, existing.palette.primary["500"]));
    setAccentBase(safeHex(existing.palette.accentBase, existing.palette.accent["500"]));
    setYuruChara({
      align: existing.yuruChara?.align ?? defaultYuruChara.align,
      verticalAlign: existing.yuruChara?.verticalAlign ?? defaultYuruChara.verticalAlign,
      originalScale: existing.yuruChara?.originalScale ?? defaultYuruChara.originalScale,
      opacity: existing.yuruChara?.opacity ?? defaultYuruChara.opacity,
      offsetX: existing.yuruChara?.offsetX ?? defaultYuruChara.offsetX,
      offsetY: existing.yuruChara?.offsetY ?? defaultYuruChara.offsetY,
    });
    setExtractedColors(existing.yuruChara?.extractedColors ?? []);
    setPendingAsset(null);
    setPendingAssetDeletion(false);

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

    return () => {
      active = false;
      disposeAssetPreview();
    };
  }, [id, loaded, themes]);

  useEffect(() => {
    setLoadedImageSize(null);
  }, [assetUri]);

  const previewLayout = useMemo(
    () => (theme?.yuruChara ? withYuruCharaDefaults(theme, yuruChara) : null),
    [theme, yuruChara],
  );
  const previewMetrics = useMemo(
    () => (previewLayout ? getYuruCharaRenderMetrics(previewLayout, viewportSize, loadedImageSize) : null),
    [previewLayout, viewportSize, loadedImageSize],
  );

  if (!theme) {
    return (
      <AppLayout back title="编辑主题">
        <StateContent
          description={loaded ? "该主题可能已被删除" : undefined}
          loading={!loaded}
          title={loaded ? "主题不存在" : "正在加载主题"}
        />
      </AppLayout>
    );
  }

  function patchYuruChara(patch: Partial<YuruCharaForm>) {
    setYuruChara(current => ({ ...current, ...patch }));
  }

  function startPositionEditing() {
    positionSnapshotRef.current = yuruChara;
    setPositionEditing(true);
  }

  function cancelPositionEditing() {
    const snapshot = positionSnapshotRef.current;
    if (snapshot) {
      setYuruChara(snapshot);
    }
    positionSnapshotRef.current = null;
    setPositionEditing(false);
  }

  function finishPositionEditing() {
    positionSnapshotRef.current = null;
    setPositionEditing(false);
  }

  function resetPositionEditing() {
    patchYuruChara({ offsetX: 0, offsetY: 0, originalScale: 100 });
  }

  function swapBaseColors() {
    setPrimaryBase(accentBase);
    setAccentBase(primaryBase);
  }

  async function pickImage() {
    const pickResult = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "image/webp"] });
    const asset = pickResult.assets?.[0];
    if (!asset?.uri || !theme) {
      return;
    }

    try {
      const colors = await extractThemeBaseColors(
        Platform.OS === "web" ? ({ file: asset.file } as never) : ({ uri: asset.uri } as never),
      );
      const imageSize = await getPickedImageSize(asset);
      const nextExtractedColors = getUniqueColorValues(colors.debugColors ?? []);
      const nextAsset: Omit<ThemeAsset, "themeId"> = {
        // Expo Image 会忽略本地文件的自定义缓存键，替换图片时需要新的 URI 前缀
        id: getYuruCharaAssetId(theme.id, Date.now()),
        fileName: asset.name ?? "yuru-chara.png",
        mimeType: (asset.mimeType as ThemeAsset["mimeType"]) ?? "image/png",
        uri: asset.uri,
        blob: Platform.OS === "web" ? ((asset.file as File) ?? undefined) : undefined,
      };
      setPrimaryBase(safeHex(colors.primaryBase, primaryBase));
      setAccentBase(safeHex(colors.accentBase, accentBase));
      setExtractedColors(nextExtractedColors);
      setPendingAssetDeletion(false);
      setPendingAsset(nextAsset);
      setAssetUri(asset.uri);

      const draft = createYuruCharaUploadDraft(theme, {
        assetId: nextAsset.id,
        imageSize,
        viewportSize,
        extractedColors: nextExtractedColors,
      });
      setTheme(draft);
      patchYuruChara({ originalScale: draft.yuruChara?.originalScale ?? yuruChara.originalScale });
    } catch (cause) {
      log.error("图片处理失败！错误：" + cause);
      notify("图片处理失败，无法读取图片颜色或处理图片", true);
    }
  }

  async function deleteYuruCharaImage() {
    if (!theme?.yuruChara) {
      return;
    }
    setTheme(createYuruCharaRemovalDraft(theme));
    setAssetUri(null);
    setExtractedColors([]);
    setPendingAsset(null);
    setPendingAssetDeletion(true);
  }

  async function handleSave() {
    if (!theme) {
      return;
    }
    setSaving(true);
    try {
      const updated = buildSavedUserTheme(theme, {
        name,
        primaryBase,
        accentBase,
        updatedAt: Date.now(),
      });
      if (theme.yuruChara) {
        updated.yuruChara = withYuruCharaDefaults(theme, yuruChara);
      } else if (pendingAssetDeletion) {
        await themeStorage.deleteThemeAsset(theme.id);
      }
      await saveTheme(updated, pendingAsset ?? undefined);
      setTheme(updated);
      setPendingAsset(null);
      setPendingAssetDeletion(false);
      notify(`主题已保存：${updated.name}`);
    } catch (cause) {
      log.error("主题保存失败！错误：" + cause);
      notify("主题保存失败，请检查颜色输入是否有效", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!theme) {
      return;
    }
    try {
      await exportUserTheme(theme);
      notify(`主题已导出：${theme.name}`);
    } catch (cause) {
      log.error("主题导出失败！错误：" + cause);
      notify("主题导出失败，无法生成主题包", true);
    }
  }

  const previewPrimary = safeGenerateTailwindScale(primaryBase, theme.palette.primary);
  const previewAccent = safeGenerateTailwindScale(accentBase, theme.palette.accent);
  const previewImageWidth = previewLayout?.imageWidth || loadedImageSize?.width || 0;
  const previewImageHeight = previewLayout?.imageHeight || loadedImageSize?.height || 0;
  const scaleMin = getMinOriginalScaleForOnePixel(previewImageWidth, previewImageHeight);
  const anchorLabel =
    anchorGrid.find(item => item.align === yuruChara.align && item.verticalAlign === yuruChara.verticalAlign)?.label ??
    "未知";

  return (
    <AppLayout back title="编辑主题">
      <SettingsSectionTitle>基础</SettingsSectionTitle>
      <VStack gap="$4" paddingHorizontal="$4">
        <Field label="主题名称">
          <TextInput aria-label="主题名称" placeholder="请输入主题名称" value={name} onChangeText={setName} />
        </Field>
        <Field label="Primary 主色">
          <ColorField candidates={extractedColors} title="Primary 主色" value={primaryBase} onChange={setPrimaryBase} />
          <ScalePreview scale={previewPrimary} />
        </Field>
        <HStack>
          <Button icon="tabler:repeat" variant="outline" onPress={swapBaseColors}>
            交换主色与强调色
          </Button>
        </HStack>
        <Field label="Accent 强调色">
          <ColorField candidates={extractedColors} title="Accent 强调色" value={accentBase} onChange={setAccentBase} />
          <ScalePreview scale={previewAccent} />
        </Field>
      </VStack>

      <SettingsSectionTitle>看板娘</SettingsSectionTitle>
      <VStack gap="$4" paddingHorizontal="$4">
        {positionEditing ? null : (
          <HStack gap="$3">
            <Button icon="fa6-solid:image" onPress={() => void pickImage()}>
              {assetUri ? "替换图片并自动取色" : "上传图片并自动取色"}
            </Button>
            {assetUri ? (
              <Button
                color="negative"
                icon="fa6-solid:trash"
                variant="outline"
                onPress={() => void deleteYuruCharaImage()}
              >
                删除图片
              </Button>
            ) : null}
          </HStack>
        )}
        {assetUri && previewLayout && previewMetrics ? (
          <YuruCharaPreview
            align={yuruChara.align}
            height={previewMetrics.height}
            opacity={yuruChara.opacity}
            offsetX={yuruChara.offsetX}
            offsetY={yuruChara.offsetY}
            uri={assetUri}
            verticalAlign={yuruChara.verticalAlign}
            width={previewMetrics.width}
            onImageSize={setLoadedImageSize}
          />
        ) : null}
        {assetUri ? (
          positionEditing ? (
            <>
              <VStack backgroundColor="$surfaceMuted" borderRadius="$3" gap="$1" padding="$3">
                <Text semiBold size="sm">
                  调整位置和大小
                </Text>
                <Text color="$textMuted" size="sm">
                  拖动滑杆调整，或输入数值精确调整
                </Text>
                <Text color="$textMuted" size="sm">
                  基准：{anchorLabel}
                </Text>
              </VStack>
              <EditableSliderField
                accessibilityLabel="看板娘缩放数值"
                label="缩放（%）"
                value={yuruChara.originalScale}
                onCommit={value => patchYuruChara({ originalScale: resolveScaleEntry(value, scaleMin) })}
              >
                <Slider
                  accessibilityLabel="看板娘缩放"
                  max={SCALE_LIMIT}
                  min={scaleMin}
                  step={1}
                  value={[resolveScaleEntry(yuruChara.originalScale, scaleMin)]}
                  onValueChange={([value]) => patchYuruChara({ originalScale: resolveScaleEntry(value, scaleMin) })}
                />
              </EditableSliderField>
              <EditableSliderField
                accessibilityLabel="看板娘水平偏移数值"
                label="水平偏移"
                value={yuruChara.offsetX}
                onCommit={value => patchYuruChara({ offsetX: value })}
              >
                <Slider
                  accessibilityLabel="看板娘水平偏移"
                  max={OFFSET_SLIDER_LIMIT}
                  min={-OFFSET_SLIDER_LIMIT}
                  step={1}
                  value={[getOffsetSliderValue(yuruChara.offsetX)]}
                  onValueChange={([value]) => patchYuruChara({ offsetX: value })}
                />
              </EditableSliderField>
              <EditableSliderField
                accessibilityLabel="看板娘垂直偏移数值"
                label="垂直偏移"
                value={yuruChara.offsetY}
                onCommit={value => patchYuruChara({ offsetY: value })}
              >
                <Slider
                  accessibilityLabel="看板娘垂直偏移"
                  max={OFFSET_SLIDER_LIMIT}
                  min={-OFFSET_SLIDER_LIMIT}
                  step={1}
                  value={[getOffsetSliderValue(yuruChara.offsetY)]}
                  onValueChange={([value]) => patchYuruChara({ offsetY: value })}
                />
              </EditableSliderField>
            </>
          ) : (
            <HStack>
              <Button icon="fa6-solid:arrows-up-down-left-right" variant="outline" onPress={startPositionEditing}>
                调整位置和大小
              </Button>
            </HStack>
          )
        ) : null}
        {assetUri ? (
          <>
            <Field label="图片位置锚点">
              <AnchorGrid
                align={yuruChara.align}
                verticalAlign={yuruChara.verticalAlign}
                onSelect={(align, verticalAlign) => patchYuruChara({ align, verticalAlign })}
              />
            </Field>
            <SliderField label="透明度" suffix={formatOpacityPercent(yuruChara.opacity)}>
              <Slider
                accessibilityLabel="看板娘透明度"
                max={1}
                min={0}
                step={0.005}
                value={[yuruChara.opacity]}
                onValueChange={([value]) => patchYuruChara({ opacity: clampYuruCharaOpacity(value) })}
              />
            </SliderField>
          </>
        ) : null}
      </VStack>

      {positionEditing ? (
        <HStack gap="$3" padding="$4">
          <Button
            color="neutral"
            flex={1}
            icon="fa6-solid:rotate-left"
            variant="outline"
            onPress={resetPositionEditing}
          >
            重置
          </Button>
          <Button color="negative" flex={1} icon="fa6-solid:xmark" variant="outline" onPress={cancelPositionEditing}>
            取消
          </Button>
          <Button flex={1} icon="fa6-solid:check" onPress={finishPositionEditing}>
            完成
          </Button>
        </HStack>
      ) : (
        <HStack gap="$3" padding="$4">
          <Button disabled={saving} flex={1} icon="fa6-solid:floppy-disk" onPress={() => void handleSave()}>
            保存
          </Button>
          <Button color="neutral" flex={1} icon="fa6-solid:share" variant="outline" onPress={() => void handleExport()}>
            导出
          </Button>
        </HStack>
      )}
    </AppLayout>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <VStack gap="$2">
      <Text color="$textMuted" size="sm">
        {label}
      </Text>
      {children}
    </VStack>
  );
}

function SliderField({ children, label, suffix }: { children: ReactNode; label: string; suffix: string }) {
  return (
    <VStack gap="$1">
      <HStack justifyContent="space-between">
        <Text color="$textMuted" size="sm">
          {label}
        </Text>
        <Text color="$textMuted" size="sm">
          {suffix}
        </Text>
      </HStack>
      {children}
    </VStack>
  );
}

function EditableSliderField({
  accessibilityLabel,
  children,
  label,
  onCommit,
  value,
}: {
  accessibilityLabel: string;
  children: ReactNode;
  label: string;
  onCommit: (value: number) => void;
  value: number;
}) {
  return (
    <VStack gap="$1">
      <HStack alignItems="center" gap="$2" justifyContent="space-between">
        <Text color="$textMuted" size="sm">
          {label}
        </Text>
        <NumberEntry accessibilityLabel={accessibilityLabel} value={value} onCommit={onCommit} />
      </HStack>
      {children}
    </VStack>
  );
}

function ColorField({
  candidates,
  onChange,
  title,
  value,
}: {
  candidates: string[];
  onChange: (value: string) => void;
  title: string;
  value: string;
}) {
  const swatchColor = safeHex(value, "#14b8a6");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDraft, setPickerDraft] = useState(swatchColor);

  function openNativePicker() {
    setPickerDraft(swatchColor);
    setPickerVisible(true);
  }

  function confirmNativePicker() {
    onChange(safeHex(pickerDraft, swatchColor));
    setPickerVisible(false);
  }

  return (
    <VStack gap="$2">
      <Text color="$textMuted" size="sm">
        {Platform.OS === "web" ? "点击色块调用浏览器 / 系统调色板" : "点击色块打开调色板，确定后应用"}
      </Text>
      <HStack alignItems="center" gap="$3">
        {Platform.OS === "web" ? (
          createWebColorInput({ color: swatchColor, title, onChange })
        ) : (
          <VStack
            aria-label={`打开 ${title} 调色板`}
            role="button"
            backgroundColor={swatchColor}
            borderColor="$border"
            borderRadius="$2"
            borderWidth={1}
            height={40}
            width={40}
            onPress={openNativePicker}
          />
        )}
        <TextInput
          aria-label={`${title} Hex 值`}
          flex={1}
          placeholder="Hex（可选）"
          value={value}
          onChangeText={onChange}
        />
      </HStack>
      {candidates.length > 0 ? (
        <VStack gap="$2">
          <Text color="$textMuted" size="sm">
            从图片提取的颜色
          </Text>
          <HStack role="group" aria-label={`${title} 图片取色`} flexWrap="wrap" gap="$2">
            {candidates.map(color => {
              const selected = safeHex(color, color) === swatchColor;
              return (
                <VStack
                  key={color}
                  aria-label={`选择颜色 ${color}`}
                  role="button"
                  {...(Platform.OS === "web"
                    ? { render: createElement("button", { type: "button", "aria-pressed": selected }) }
                    : { accessibilityState: { selected } })}
                  backgroundColor={color}
                  borderColor={selected ? "$primaryBorder" : "$border"}
                  borderRadius="$3"
                  borderWidth={selected ? 3 : 1}
                  height={40}
                  width={40}
                  onPress={() => onChange(color)}
                />
              );
            })}
          </HStack>
        </VStack>
      ) : null}
      {Platform.OS === "web" ? null : (
        <SettingsColorPicker
          title={title}
          visible={pickerVisible}
          value={pickerDraft}
          onChange={setPickerDraft}
          onCancel={() => setPickerVisible(false)}
          onConfirm={confirmNativePicker}
        />
      )}
    </VStack>
  );
}

function createWebColorInput({
  color,
  onChange,
  title,
}: {
  color: string;
  onChange: (value: string) => void;
  title: string;
}) {
  return createElement("input", {
    "aria-label": `${title} 调色板`,
    type: "color",
    value: color,
    onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value),
    style: {
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      height: 40,
      padding: 0,
      width: 40,
    },
  });
}

function ScalePreview({ scale }: { scale: TailwindScale }) {
  return (
    <HStack borderRadius="$2" height={32} overflow="hidden">
      {Object.entries(scale).map(([shade, color]) => (
        <VStack key={shade} flex={1} backgroundColor={color} />
      ))}
    </HStack>
  );
}

function AnchorGrid({
  align,
  onSelect,
  verticalAlign,
}: {
  align: YuruCharaAlign;
  onSelect: (align: YuruCharaAlign, verticalAlign: YuruCharaVerticalAlign) => void;
  verticalAlign: YuruCharaVerticalAlign;
}) {
  return (
    <VStack
      role="group"
      aria-label="图片位置锚点"
      alignSelf="flex-start"
      borderColor="$border"
      borderRadius="$3"
      borderWidth={1}
      gap="$1"
      padding="$1"
    >
      {[0, 1, 2].map(row => (
        <HStack key={row} gap="$1">
          {anchorGrid.slice(row * 3, row * 3 + 3).map(item => {
            const selected = item.align === align && item.verticalAlign === verticalAlign;
            return (
              <VStack
                key={`${item.align}-${item.verticalAlign}`}
                aria-label={`图片位置锚点：${item.label}`}
                role="button"
                // Real buttons provide Enter/Space activation without a second event path.
                {...(Platform.OS === "web"
                  ? { render: createElement("button", { type: "button", "aria-pressed": selected }) }
                  : { accessibilityState: { selected } })}
                alignItems="center"
                backgroundColor={selected ? "$primaryTintPress" : "$surfaceMuted"}
                borderRadius="$2"
                height={40}
                justifyContent="center"
                width={40}
                onPress={() => onSelect(item.align, item.verticalAlign)}
              >
                <VStack
                  backgroundColor={selected ? "$primarySolid" : "$textDisabled"}
                  borderRadius="$full"
                  height={selected ? 14 : 10}
                  width={selected ? 14 : 10}
                />
              </VStack>
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
}

function YuruCharaPreview({
  align,
  height,
  offsetX,
  offsetY,
  opacity,
  onImageSize,
  uri,
  verticalAlign,
  width,
}: {
  align: YuruCharaAlign;
  height: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
  onImageSize?: (size: { width: number; height: number } | null) => void;
  uri: string;
  verticalAlign: YuruCharaVerticalAlign;
  width: number;
}) {
  const horizontal: ViewStyle =
    align === "left" ? { left: 0 } : align === "right" ? { right: 0 } : { left: "50%", marginLeft: -width / 2 };
  const vertical: ViewStyle =
    verticalAlign === "top"
      ? { top: 0 }
      : verticalAlign === "bottom"
        ? { bottom: 0 }
        : { top: "50%", marginTop: -height / 2 };

  return (
    <View style={styles.previewBox}>
      <View
        pointerEvents="none"
        style={[
          {
            height,
            width,
            opacity,
            position: "absolute",
            transform: [{ translateX: offsetX }, { translateY: offsetY }],
          },
          horizontal,
          vertical,
        ]}
      >
        <Image
          contentFit="fill"
          source={{ uri }}
          style={styles.previewImage}
          onLoad={event => onImageSize?.(getLoadedImageSize(event))}
        />
      </View>
    </View>
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

/** 与 v2 一致：存储尺寸缺失时用实际加载出的图片尺寸兜底，动态缩放下限才准确。 */
function getLoadedImageSize(event: unknown): { width: number; height: number } | null {
  const source = (event as { source?: { width?: unknown; height?: unknown } })?.source;
  const width = typeof source?.width === "number" ? source.width : 0;
  const height = typeof source?.height === "number" ? source.height : 0;
  return width > 0 && height > 0 ? { width, height } : null;
}

function safeHex(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  try {
    return hexFromCssColor(value);
  } catch {
    return fallback;
  }
}

function safeGenerateTailwindScale(baseColor: string, fallback: TailwindScale): TailwindScale {
  try {
    return generateTailwindScale(baseColor);
  } catch {
    return fallback;
  }
}

function getUniqueColorValues(colors: string[]): string[] {
  const seen = new Set<string>();
  return colors.filter(color => {
    const normalized = safeHex(color, color);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

const styles = StyleSheet.create({
  previewBox: {
    backgroundColor: "rgba(128, 128, 128, 0.12)",
    borderRadius: 12,
    height: 160,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
});
