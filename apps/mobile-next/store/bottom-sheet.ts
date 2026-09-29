import { create } from "zustand";

interface BottomSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useBottomSheetStore = create<BottomSheetState>(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
