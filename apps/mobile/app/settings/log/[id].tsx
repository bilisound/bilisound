import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Layout, LayoutButton } from "~/components/layout";
import { LogViewer } from "~/components/log-viewer";
import { useLocalSearchParams } from "expo-router";
import { getLog, shareLog } from "~/utils/logger";

const App: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const edgeInsets = useSafeAreaInsets();
  const { data } = useQuery({
    queryKey: ["license"],
    queryFn: () => {
      return getLog(id);
    },
  });

  return (
    <Layout
      title="查看日志详情"
      leftAccessories="BACK_BUTTON"
      rightAccessories={
        <LayoutButton
          iconName={"fa6-solid:share"}
          aria-label={"分享日志"}
          onPress={() => {
            shareLog(id);
          }}
        />
      }
      edgeInsets={{ ...edgeInsets, bottom: 0 }}
    >
      {data ? <LogViewer text={data} /> : null}
    </Layout>
  );
};

export default App;
