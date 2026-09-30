import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogBody,
  AlertDialogDescription,
  AlertDialogFooter,
  Button,
} from "@bilisound/ui";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onClose: (confirmed: boolean) => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "确定",
  cancelText = "取消",
  onClose,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={value => {
        if (!value) onClose(false);
      }}
    >
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="ghost" color="neutral" onPress={() => onClose(false)}>
              {cancelText}
            </Button>
            <Button onPress={() => onClose(true)}>{confirmText}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
