declare module "react-native-get-random-values" {}

declare module "react-native-url-polyfill/auto" {}

declare module "core-js/actual/array/to-spliced" {}

declare module "expo-file-system/legacy" {
  export interface DownloadProgressData {
    totalBytesWritten: number;
    totalBytesExpectedToWrite: number;
  }

  export interface DownloadResumable {
    downloadAsync(): Promise<unknown>;
    cancelAsync(): Promise<void>;
  }

  export const cacheDirectory: string | null;
  export const documentDirectory: string | null;
  export function createDownloadResumable(
    uri: string,
    fileUri: string,
    options?: Record<string, unknown>,
    callback?: (downloadProgress: DownloadProgressData) => void,
  ): DownloadResumable;
  export function makeDirectoryAsync(uri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function moveAsync(options: { from: string; to: string }): Promise<void>;
  export function deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
  export function readDirectoryAsync(uri: string): Promise<string[]>;
  export function readAsStringAsync(uri: string, options?: { encoding?: string }): Promise<string>;
  export function writeAsStringAsync(uri: string, contents: string): Promise<void>;
  export function getInfoAsync(uri: string): Promise<{ exists: false } | { exists: true; size: number }>;
}
