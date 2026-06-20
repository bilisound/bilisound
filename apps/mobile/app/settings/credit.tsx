import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Layout } from "~/components/layout";
import { Text } from "~/components/ui/text";
import { useRawThemeValues } from "~/components/ui/gluestack-ui-provider/theme";

interface CreditItem {
  category: string;
  items: {
    name: string;
    author: string;
    description?: string;
  }[];
}

const credits: CreditItem[] = [
  {
    category: "应用开发",
    items: [
      {
        name: "项目原案",
        author: "qwe7002",
      },
      {
        name: "客户端开发、UI/UX 设计",
        author: "tcdw",
      },
      {
        name: "VI 设计",
        author: "SumiMakito / ClassicOldSong",
      },
      {
        name: "看板娘",
        author: "核桃 / 茹雪",
      },
    ],
  },
  {
    category: "开源库",
    items: [
      {
        name: "React Native",
        author: "Meta",
        description: "跨平台移动应用框架",
      },
      {
        name: "Expo",
        author: "Expo Team",
        description: "React Native 开发平台",
      },
      {
        name: "Gluestack UI",
        author: "Gluestack",
        description: "UI 组件库",
      },
      {
        name: "NativeWind",
        author: "Mark Lawlor",
        description: "React Native 的 TailwindCSS 实现",
      },
      {
        name: "Expo Router",
        author: "Expo Team",
        description: "基于文件的路由系统",
      },
      {
        name: "React Query",
        author: "TanStack",
        description: "数据获取与缓存",
      },
      {
        name: "Zustand",
        author: "pmndrs",
        description: "状态管理",
      },
    ],
  },
  {
    category: "图标资源",
    items: [
      {
        name: "Font Awesome",
        author: "Fonticons, Inc.",
      },
      {
        name: "Ionicons",
        author: "Ionic Team",
      },
      {
        name: "Tabler Icons",
        author: "Paweł Kuna",
      },
    ],
  },
];

function CreditSection({ category, items }: CreditItem) {
  const { colorValue } = useRawThemeValues();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{category}</Text>
      <View style={[styles.card, { backgroundColor: colorValue("--color-background-50") }]}>
        {items.map((item, index) => (
          <View
            key={item.name}
            style={[
              styles.item,
              index !== items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colorValue("--color-background-200"),
              },
            ]}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemAuthor}>{item.author}</Text>
            {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Page() {
  const edgeInsets = useSafeAreaInsets();

  return (
    <Layout title="致谢" leftAccessories="BACK_BUTTON" edgeInsets={{ ...edgeInsets, bottom: 0 }}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.intro}>感谢以下开源项目和贡献者，使本应用成为可能</Text>
          {credits.map(credit => (
            <CreditSection key={credit.category} {...credit} />
          ))}
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingVertical: 16,
  },
  intro: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.5,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemName: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  itemAuthor: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
    marginTop: 2,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.5,
    marginTop: 4,
  },
});
