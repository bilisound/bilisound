import { ReleaseChannel } from "~/constants/releasing";

declare const process: {
  env: {
    NODE_ENV: string;
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_RELEASE_CHANNEL: ReleaseChannel;
  };
};
