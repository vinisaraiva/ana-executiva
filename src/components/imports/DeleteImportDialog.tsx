/**
 * @fileoverview Diálogo de Exclusão de Importação - DrGeFin
 * 
 * Modal de confirmação para desativar/excluir uma importação.
 * A exclusão é "soft delete" - os dados não são removidos
 * permanentemente, apenas desativados das análises.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

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
import { Trash2 } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props do componente DeleteImportDialog.
 */
interface DeleteImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteImportDialog({
  open,
  onOpenChange,
  filename,
  onConfirm,
  isDeleting,
}: DeleteImportDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Excluir importação
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a importação <strong>"{filename}"</strong>?
            <br />
            <br />
            Esta ação irá desativar a importação e seus dados não serão mais 
            considerados nas análises. Os dados não serão deletados permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
