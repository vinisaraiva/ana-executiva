import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Replace, Merge, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExistingImport {
  id: string;
  filename: string;
  start_date: string;
  end_date: string;
  overlap_type?: 'new_contains_old' | 'old_contains_new' | 'partial' | 'none' | 'unknown';
  recommendation?: 'replace' | 'merge' | 'skip' | null;
}

interface OverlapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingImports: ExistingImport[];
  newPeriod?: { start: string; end: string } | null;
  overallRecommendation?: 'replace' | 'merge' | 'skip' | null;
  onReplace: () => void;
  onMerge: () => void;
  onCancel: () => void;
}

const overlapTypeLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new_contains_old: { label: 'Novo contém antigo', variant: 'default' },
  old_contains_new: { label: 'Antigo contém novo', variant: 'destructive' },
  partial: { label: 'Sobreposição parcial', variant: 'secondary' },
  none: { label: 'Períodos complementares', variant: 'outline' },
  unknown: { label: 'Não analisado', variant: 'outline' },
};

export function OverlapDialog({
  open,
  onOpenChange,
  existingImports,
  newPeriod,
  overallRecommendation,
  onReplace,
  onMerge,
  onCancel,
}: OverlapDialogProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Importações existentes detectadas
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Já existem importações ativas para este tenant. Escolha como tratar a sobreposição:
              </p>

              {/* New file period */}
              {newPeriod && (
                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Novo arquivo: {formatDate(newPeriod.start)} - {formatDate(newPeriod.end)}
                  </p>
                </div>
              )}

              {/* Existing imports */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Importações existentes:</p>
                <ul className="text-sm space-y-2">
                  {existingImports.map((imp) => {
                    const typeInfo = overlapTypeLabels[imp.overlap_type || 'unknown'];
                    return (
                      <li key={imp.id} className="flex flex-col gap-1 py-1 border-b border-border/50 last:border-0">
                        <div className="flex justify-between items-start">
                          <span className="truncate max-w-[180px] font-medium">{imp.filename}</span>
                          <Badge variant={typeInfo.variant} className="text-xs">
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(imp.start_date)} - {formatDate(imp.end_date)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Recommendation alert */}
              {overallRecommendation === 'skip' && (
                <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20 flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">
                    <strong>Atenção:</strong> O arquivo existente já contém o período do novo arquivo. 
                    Esta importação pode ser desnecessária.
                  </p>
                </div>
              )}

              {overallRecommendation === 'replace' && (
                <div className="bg-success/10 rounded-lg p-3 border border-success/20 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <p className="text-sm text-success">
                    <strong>Recomendado: Substituir.</strong> O novo arquivo contém todos os dados das importações anteriores.
                  </p>
                </div>
              )}

              {overallRecommendation === 'merge' && (
                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-primary">
                    <strong>Recomendado: Mesclar.</strong> Os períodos são complementares. Linhas duplicadas serão ignoradas automaticamente.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-auto py-3",
              overallRecommendation === 'replace' && "ring-2 ring-success ring-offset-2"
            )}
            onClick={onReplace}
          >
            <Replace className="h-5 w-5 text-destructive" />
            <div className="text-left">
              <p className="font-medium flex items-center gap-2">
                Substituir importações anteriores
                {overallRecommendation === 'replace' && (
                  <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Desativa as importações listadas. Use quando o novo arquivo contém TODOS os dados anteriores (ex: trimestre substituindo mês)
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-auto py-3",
              overallRecommendation === 'merge' && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={onMerge}
          >
            <Merge className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium flex items-center gap-2">
                Mesclar dados
                {overallRecommendation === 'merge' && (
                  <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Mantém ambos ativos. Linhas idênticas (mesma data + pedido + SKU + quantidade + valor) serão ignoradas. Use para períodos complementares (ex: Q1 + Q2)
              </p>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
