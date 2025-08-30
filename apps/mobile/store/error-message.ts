import { createWithEqualityFn } from "zustand/traditional";

export interface ErrorMessageProps {
  message: string | null;
}

export interface ErrorMessageMethods {
  setMessage: (message: string | null) => void;
}

const useErrorMessageStore = createWithEqualityFn<ErrorMessageProps & ErrorMessageMethods>()(setState => ({
  message: null,
  setMessage: message => setState(() => ({ message })),
}));

export default useErrorMessageStore;
