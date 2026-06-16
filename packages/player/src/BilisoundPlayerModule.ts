import { requireNativeModule } from "expo-modules-core";
import type { EventEmitter } from "expo-modules-core/types";

import type { EventList } from "./types";
import type { BilisoundPlayerModuleInterface } from "./types/module";

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
export const BilisoundPlayerModule = requireNativeModule<EventEmitter<EventList> & BilisoundPlayerModuleInterface>(
  "BilisoundPlayer",
);
