import { create } from "zustand";

export interface UpdateTriggerProps {
  count: number;
}

export interface UpdateTriggerMethods {
  setCount: (count: number) => void;
  incrementCount: () => void;
}

export const useUpdateTriggerStore = create<UpdateTriggerProps & UpdateTriggerMethods>()((set, get) => ({
  count: 0,
  setCount: count => set(state => ({ count })),
  incrementCount: () => set(state => ({ count: state.count + 1 })),
}));
