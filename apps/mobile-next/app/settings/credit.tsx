import { Text, VStack } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";

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
        name: "Tamagui",
        author: "Nate Wienert 与社区贡献者",
        description: "跨平台 UI 组件与主题系统",
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

export default function CreditScreen() {
  return (
    <AppLayout back title="致谢">
      <VStack gap="$6" paddingBottom="$8" paddingTop="$4">
        <Text color="$textMuted" paddingHorizontal="$4" size="sm" textAlign="center">
          感谢以下开源项目和贡献者，使本应用成为可能
        </Text>
        {credits.map(section => (
          <VStack gap="$3" key={section.category}>
            <Text color="$text" paddingHorizontal="$4" size="lg" semiBold>
              {section.category}
            </Text>
            <VStack backgroundColor="$surfaceMuted" borderRadius="$3" marginHorizontal="$4" overflow="hidden">
              {section.items.map((item, index) => (
                <VStack
                  borderColor="$border"
                  borderTopWidth={index === 0 ? 0 : 1}
                  gap="$1"
                  key={item.name}
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                >
                  <Text color="$text" semiBold>
                    {item.name}
                  </Text>
                  <Text color="$textMuted" size="sm">
                    {item.author}
                  </Text>
                  {item.description ? (
                    <Text color="$textMuted" size="sm">
                      {item.description}
                    </Text>
                  ) : null}
                </VStack>
              ))}
            </VStack>
          </VStack>
        ))}
      </VStack>
    </AppLayout>
  );
}
