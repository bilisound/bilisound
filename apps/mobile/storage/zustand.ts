import { MMKV } from "react-native-mmkv";
import superJson from "superjson";
import { PersistStorage } from "zustand/middleware";

export const zustandStorage = new MMKV({ id: "storage-zustand" });

export function createStorage<T>() {
  const storage: PersistStorage<T> = {
    getItem: name => {
      const str = zustandStorage.getString(name);
      if (!str) return null;
      return superJson.parse(str);
    },
    setItem: (name, value) => {
      zustandStorage.set(name, superJson.stringify(value));
    },
    removeItem: name => {
      zustandStorage.delete(name);
    },
  };
  return storage;
}
