import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmationDialog = ({
  open,
  title,
  description,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmationDialogProps) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !deleting) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent aria-busy={deleting}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={onConfirm}>
            {deleting ? "Видалення..." : "Видалення"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
