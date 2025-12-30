import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Layout } from "~/components/layout";
import { Text } from "~/components/ui/text";

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
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold px-4 mb-3 opacity-80">{category}</Text>
      <View className="bg-background-50 dark:bg-background-800 rounded-xl mx-4">
        {items.map((item, index) => (
          <View
            key={item.name}
            className={`px-4 py-3 ${index !== items.length - 1 ? "border-b border-background-200 dark:border-background-700" : ""}`}
          >
            <Text className="text-base font-medium">{item.name}</Text>
            <Text className="text-sm opacity-60 mt-0.5">{item.author}</Text>
            {item.description && <Text className="text-sm opacity-50 mt-1">{item.description}</Text>}
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
      <ScrollView className="flex-1">
        <View className="py-4">
          <Text className="text-center text-sm opacity-50 px-4 mb-6">感谢以下开源项目和贡献者，使本应用成为可能</Text>
          {credits.map(credit => (
            <CreditSection key={credit.category} {...credit} />
          ))}
        </View>
      </ScrollView>
    </Layout>
  );
}
