import { useRef, useState } from "react";

export interface ConfirmInfo {
  title: string;
  description: string;
  ok: string;
  cancel: string;
}

export function useConfirm(initialConformInfo: Partial<ConfirmInfo> = {}) {
  // 模态框管理
  const [dialogInfo, setDialogInfo] = useState<ConfirmInfo>({
    ...initialConformInfo,
    title: "",
    description: "",
    ok: "确定",
    cancel: "取消",
  });
  const dialogCallback = useRef<() => void>();
  const [modalVisible, setModalVisible] = useState(false);

  function handleClose(ok: boolean) {
    setModalVisible(false);
    if (ok) {
      dialogCallback.current?.();
    }
  }

  return {
    dialogInfo,
    setDialogInfo,
    modalVisible,
    setModalVisible,
    handleClose,
    dialogCallback,
  };
}
