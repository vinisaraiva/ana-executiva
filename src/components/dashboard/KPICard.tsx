/**
 * @fileoverview Card de KPI (Indicador-Chave de Performance) - DrGeFin
 * 
 * Componente que exibe um indicador com:
 * - Título do indicador
 * - Valor atual formatado
 * - Ícone representativo
 * - Variação percentual em relação ao período anterior
 * 
 * Usado no dashboard para exibir métricas como:
 * - Faturamento Total
 * - Total de Vendas
 * - Ticket Médio
 * - Margem Bruta
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Propriedades do componente KPICard.
 */
interface KPICardProps {
  /** Título do indicador (ex: "Faturamento Total") */
  title: string;
  /** Valor formatado para exibição (ex: "R$ 150.000,00") */
  value: string;
  /** Valor do período anterior (para cálculo de variação) */
  previousValue?: number;
  /** Valor do período atual (para cálculo de variação) */
  currentValue?: number;
  /** Ícone a ser exibido no card */
  icon: LucideIcon;
  /** Formato do valor (não utilizado atualmente, reservado para uso futuro) */
  format?: 'currency' | 'number' | 'percent';
  /** Classe CSS para cor do ícone */
  iconColor?: string;
  /** Classe CSS para cor de fundo do ícone */
  iconBgColor?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Card de indicador-chave de performance (KPI).
 * 
 * Exibe um indicador com valor, ícone e variação percentual
 * em relação ao período anterior. A variação é indicada visualmente
 * com cores e ícones de tendência.
 * 
 * @example
 * ```tsx
 * <KPICard
 *   title="Faturamento Total"
 *   value="R$ 150.000,00"
 *   currentValue={150000}
 *   previousValue={120000}
 *   icon={DollarSign}
 *   iconColor="text-primary"
 *   iconBgColor="bg-primary/10"
 * />
 * ```
 */
export function KPICard({
  title,
  value,
  previousValue,
  currentValue,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
}: KPICardProps) {
  // Calcula a variação percentual se houver valores de comparação
  const variation = previousValue && currentValue 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : null;

  // Determina o estado da variação para estilização
  const isPositive = variation !== null && variation > 0;
  const isNegative = variation !== null && variation < 0;
  const isNeutral = variation === null || variation === 0;

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          {/* Seção: Conteúdo textual (título, valor, variação) */}
          <div className="space-y-1">
            {/* Título do indicador */}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            
            {/* Valor principal formatado */}
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            
            {/* Variação percentual (se disponível) */}
            {variation !== null && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isPositive && "text-success",
                isNegative && "text-destructive",
                isNeutral && "text-muted-foreground"
              )}>
                {/* Ícone de tendência */}
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                {isNeutral && <Minus className="h-3 w-3" />}
                
                {/* Texto da variação */}
                <span>
                  {isPositive && '+'}
                  {variation.toFixed(1)}% vs anterior
                </span>
              </div>
            )}
          </div>
          
          {/* Seção: Ícone do indicador */}
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            iconBgColor
          )}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
