/**
 * @fileoverview Banner de Importação Ativa - DrGeFin
 * 
 * Componente que exibe informações sobre os dados ativos no dashboard:
 * - Quantidade de arquivos ativos
 * - Nomes dos arquivos (com tooltip para múltiplos)
 * - Período dos dados (data início - data fim)
 * - Indicador de sobreposição de períodos
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Database, Calendar, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Informações sobre as importações ativas.
 */
interface ActiveImportInfo {
  /** Quantidade de importações ativas */
  count: number;
  /** Nomes dos arquivos importados */
  files: string[];
  /** Data de início do período (mais antiga) */
  startDate: string | null;
  /** Data de fim do período (mais recente) */
  endDate: string | null;
  /** Indica se há sobreposição entre períodos das importações */
  hasOverlap: boolean;
}

/**
 * Propriedades do componente ActiveImportBanner.
 */
interface ActiveImportBannerProps {
  /** Informações da importação ativa (null = sem dados) */
  activeImport: ActiveImportInfo | null;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Banner informativo sobre as importações ativas.
 * 
 * Exibe uma barra no topo do dashboard com informações
 * sobre os dados que estão sendo visualizados.
 * 
 * @example
 * ```tsx
 * <ActiveImportBanner
 *   activeImport={{
 *     count: 2,
 *     files: ['vendas-jan.xlsx', 'vendas-fev.xlsx'],
 *     startDate: '2024-01-01',
 *     endDate: '2024-02-29',
 *     hasOverlap: false
 *   }}
 * />
 * ```
 */
export function ActiveImportBanner({ activeImport }: ActiveImportBannerProps) {
  // Não renderiza se não houver importação ativa
  if (!activeImport) {
    return null;
  }

  /**
   * Formata data para exibição.
   * @param dateStr - Data em formato ISO
   * @returns Data formatada (ex: "15 de jan 2024")
   */
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), "dd 'de' MMM yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Verifica se há intervalo de datas válido
  const hasDateRange = activeImport.startDate && activeImport.endDate;
  
  // Verifica se é um único arquivo
  const isSingleFile = activeImport.count === 1;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
      {/* Indicador: Dados Ativos */}
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Dados Ativos</span>
      </div>
      
      {/* Separador */}
      <div className="h-4 w-px bg-primary/20" />
      
      {/* Informação: Arquivos */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        {isSingleFile ? (
          // Único arquivo - exibe nome
          <span className="truncate max-w-[200px]">
            {activeImport.files[0] || 'Arquivo importado'}
          </span>
        ) : (
          // Múltiplos arquivos - exibe contagem com tooltip
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted underline-offset-2">
                  {activeImport.count} arquivos ativos
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <ul className="text-xs space-y-1">
                  {activeImport.files.map((file, idx) => (
                    <li key={idx} className="truncate">{file}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Informação: Período (se disponível) */}
      {hasDateRange && (
        <>
          <div className="h-4 w-px bg-primary/20" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {formatDate(activeImport.startDate)} - {formatDate(activeImport.endDate)}
            </span>
          </div>
        </>
      )}

      {/* Alerta: Sobreposição de períodos */}
      {activeImport.hasOverlap && (
        <>
          <div className="h-4 w-px bg-primary/20" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500 cursor-help">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Sobreposição</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs max-w-[200px]">
                  Os períodos dos imports se sobrepõem. Dados podem estar duplicados.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}
