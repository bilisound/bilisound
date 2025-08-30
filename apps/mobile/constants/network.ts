import { VERSION } from "~/constants/releasing";

export const USER_AGENT_BILIBILI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

export const USER_AGENT_BILISOUND = `Bilisound/${VERSION}`;

export const BILISOUND_API_PREFIX = process.env.EXPO_PUBLIC_API_URL;
