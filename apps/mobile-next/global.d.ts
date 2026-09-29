declare const process: {
  env: {
    NODE_ENV: string;
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_RELEASE_CHANNEL: import("~/constants/releasing").ReleaseChannel;
  };
};

declare module "*.png" {
  const value: number;
  export default value;
}
