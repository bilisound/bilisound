import type { SettingsMethods } from "./types";

declare const actions: SettingsMethods;

actions.toggle("debugMode");
// @ts-expect-error theme is not a boolean setting
actions.toggle("theme");
