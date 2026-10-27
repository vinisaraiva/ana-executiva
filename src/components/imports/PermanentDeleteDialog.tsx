import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface PermanentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function PermanentDeleteDialog({
  open,
  onOpenChange,
  filename,
  onConfirm,
  isDeleting,
}: PermanentDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Excluir Permanentemente</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 space-y-3">
            <p>
              Você está prestes a excluir permanentemente a importação:
            </p>
            <p className="font-medium text-foreground bg-muted px-3 py-2 rounded-md truncate">
              {filename}
            </p>
            <p className="text-destructive font-medium">
              ⚠️ Esta ação é irreversível!
            </p>
            <p>
              Todos os dados associados serão deletados permanentemente:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Linhas de vendas importadas</li>
              <li>Fatos e métricas calculadas</li>
              <li>Anomalias detectadas</li>
              <li>Arquivo original</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Permanentemente'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
