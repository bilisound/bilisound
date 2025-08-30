import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Asset } from "expo-asset";

import { Layout } from "~/components/layout";
import { LogViewer } from "~/components/log-viewer";

const App: React.FC = () => {
  const edgeInsets = useSafeAreaInsets();
  const { data } = useQuery({
    queryKey: ["license"],
    queryFn: async () => {
      const asset = Asset.fromModule(require("../../third-party-licenses.txt"));
      await asset.downloadAsync();
      const response = await fetch(asset.localUri!);
      return response.text();
    },
  });

  return (
    <Layout title="开源软件许可证" leftAccessories="BACK_BUTTON" edgeInsets={{ ...edgeInsets, bottom: 0 }}>
      {data ? <LogViewer text={data} /> : null}
    </Layout>
  );
};

export default App;
