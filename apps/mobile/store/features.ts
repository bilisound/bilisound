import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createStorage } from "~/storage/zustand";

export interface FeaturesProps {
  enableNavbar2: boolean;
}

export interface FeaturesMethods {
  setEnableNavbar2: (enableNavbar2: boolean) => void;
}

const useFeaturesStore = create<FeaturesProps & FeaturesMethods>()(
  persist(
    (set, get) => ({
      enableNavbar2: false,
      setEnableNavbar2: enableNavbar2 => set(() => ({ enableNavbar2 })),
    }),
    {
      name: "features-store",
      storage: createStorage<FeaturesProps>(),
    },
  ),
);

export default useFeaturesStore;
