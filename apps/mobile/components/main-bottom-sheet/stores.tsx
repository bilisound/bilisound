import { create } from "zustand";

export interface ActionSheetState {
  showActionSheet: boolean;
  showSpeedActionSheet: boolean;
  setShowActionSheet: (value: boolean) => void;
  setShowSpeedActionSheet: (value: boolean) => void;
  handleClose: () => void;
  handleSpeedClose: () => void;
}

export const useActionSheetStore = create<ActionSheetState>(set => ({
  showActionSheet: false,
  showSpeedActionSheet: false,
  setShowActionSheet: value => set(() => ({ showActionSheet: value })),
  setShowSpeedActionSheet: value => set(() => ({ showSpeedActionSheet: value })),
  handleClose: () => set(() => ({ showActionSheet: false })),
  handleSpeedClose: () => set(() => ({ showSpeedActionSheet: false })),
}));
