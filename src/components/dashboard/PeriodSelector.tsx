/**
 * @fileoverview Seletor de Período - DrGeFin
 * 
 * Componente para seleção do período de análise do dashboard.
 * 
 * Opções disponíveis:
 * - 7 dias
 * - 30 dias
 * - 90 dias
 * 
 * Também exibe a data de referência dos dados (última data disponível).
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Propriedades do componente PeriodSelector.
 */
interface PeriodSelectorProps {
  /** Período atualmente selecionado (em dias) */
  value: number;
  /** Callback chamado quando o período é alterado */
  onChange: (days: number) => void;
  /** Data de referência dos dados (última data disponível) */
  referenceDate?: string | null;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Opções de período disponíveis.
 */
const periods = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Seletor de período de análise.
 * 
 * Permite ao usuário escolher o intervalo de tempo para
 * visualização dos dados no dashboard.
 * 
 * @example
 * ```tsx
 * <PeriodSelector
 *   value={30}
 *   onChange={(days) => setPeriod(days)}
 *   referenceDate="2024-01-15"
 * />
 * ```
 */
export function PeriodSelector({ value, onChange, referenceDate }: PeriodSelectorProps) {
  // Formata data de referência para exibição
  const formattedDate = referenceDate 
    ? format(parseISO(referenceDate), "dd/MM/yyyy", { locale: ptBR })
    : null;

  return (
    <div className="flex items-center gap-3">
      {/* Indicador de data de referência */}
      {formattedDate && (
        <span className="text-xs text-muted-foreground">
          Dados até <span className="font-medium text-foreground">{formattedDate}</span>
        </span>
      )}
      
      {/* Seletor de período */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <ToggleGroup
          type="single"
          value={String(value)}
          onValueChange={(val) => val && onChange(Number(val))}
          className="bg-muted/50 p-1 rounded-lg"
        >
          {periods.map((period) => (
            <ToggleGroupItem
              key={period.value}
              value={String(period.value)}
              size="sm"
              className="px-3 py-1.5 text-xs font-medium data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {period.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
