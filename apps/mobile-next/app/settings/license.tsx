import { useQuery } from "@tanstack/react-query";
import { Asset } from "expo-asset";

import { StateContent } from "@bilisound/ui";
import { AppLayout } from "~/components/app-layout";
import { SettingsLogViewer } from "~/components/settings-log-viewer";

export default function LicenseScreen() {
  const { data, error, refetch } = useQuery({
    queryKey: ["license"],
    queryFn: async () => {
      // 许可证文本由 Metro 作为资源打包（metro.config.js 已把 txt 加入 assetExts）；
      // ESLint 的资源 require 白名单只覆盖 Metro 默认扩展名，这里按需豁免。
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const asset = Asset.fromModule(require("../../third-party-licenses.txt"));
      await asset.downloadAsync();
      const response = await fetch(asset.localUri ?? asset.uri);
      if (!response.ok) {
        throw new Error(`无法读取许可证（HTTP ${response.status}）`);
      }
      return response.text();
    },
  });

  return (
    <AppLayout back scroll={false} title="开源软件许可证">
      {error ? (
        <StateContent
          description={error instanceof Error ? error.message : String(error)}
          title="无法读取许可证"
          onRetry={() => void refetch()}
        />
      ) : data !== undefined ? (
        <SettingsLogViewer text={data} />
      ) : (
        <StateContent loading title="正在读取许可证" />
      )}
    </AppLayout>
  );
}
