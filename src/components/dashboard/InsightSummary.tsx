/**
 * @fileoverview Resumo Inteligente - DrGeFin
 * 
 * Componente que exibe um resumo textual do desempenho financeiro,
 * gerando insights em linguagem natural baseados nos dados.
 * 
 * Funcionalidades:
 * - Texto dinâmico sobre faturamento e variação
 * - Destaque para canal de melhor performance
 * - Alerta para baixo desempenho (se houver)
 * - Estado vazio com mensagem de boas-vindas
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Propriedades do componente InsightSummary.
 */
interface InsightSummaryProps {
  /** Receita total do período atual */
  totalRevenue: number;
  /** Quantidade total de vendas */
  totalSales: number;
  /** Ticket médio calculado */
  avgTicket: number;
  /** Receita do período anterior (para comparação) */
  previousRevenue?: number;
  /** Canal de destaque (opcional) */
  topChannel?: { name: string; growth: number };
  /** Item com baixo desempenho (opcional) */
  lowPerformer?: { name: string; decline: number };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Card de resumo inteligente com insights textuais.
 * 
 * Gera texto em linguagem natural descrevendo o desempenho
 * financeiro do período, incluindo variação, destaques e alertas.
 * 
 * @example
 * ```tsx
 * <InsightSummary
 *   totalRevenue={150000}
 *   totalSales={250}
 *   avgTicket={600}
 *   previousRevenue={120000}
 *   topChannel={{ name: 'E-commerce', growth: 25 }}
 * />
 * ```
 */
export function InsightSummary({
  totalRevenue,
  totalSales,
  avgTicket,
  previousRevenue = 0,
  topChannel,
  lowPerformer,
}: InsightSummaryProps) {
  // Calcula variação percentual de receita
  const revenueGrowth = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;
  
  /**
   * Formata valor como moeda brasileira.
   */
  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Verifica se há dados para exibir
  const hasData = totalRevenue > 0 || totalSales > 0;

  // Estado vazio - mensagem de boas-vindas
  if (!hasData) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Bem-vindo ao seu Dashboard Inteligente</h3>
              <p className="text-muted-foreground">
                Faça sua primeira importação de dados para ver insights personalizados sobre seu negócio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Array para construir o texto de insights
  const insights: string[] = [];
  
  // Insight principal: faturamento do período
  insights.push(`Este período você faturou ${formatCurrency(totalRevenue)}`);
  
  // Adiciona variação se houver dados de comparação
  if (revenueGrowth !== 0) {
    const direction = revenueGrowth > 0 ? 'crescimento' : 'queda';
    insights[0] += `, um ${direction} de ${Math.abs(revenueGrowth).toFixed(1)}% comparado ao período anterior`;
  }
  insights[0] += '.';

  // Insight sobre canal de destaque
  if (topChannel && topChannel.growth > 0) {
    insights.push(`O canal ${topChannel.name} foi o destaque com +${topChannel.growth.toFixed(0)}%.`);
  }

  // Alerta sobre baixo desempenho
  if (lowPerformer && lowPerformer.decline < -10) {
    insights.push(`Atenção: ${lowPerformer.name} está ${Math.abs(lowPerformer.decline).toFixed(0)}% abaixo da média.`);
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Ícone do card */}
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          
          <div className="space-y-2">
            {/* Título com indicador de tendência */}
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Resumo Inteligente
              {revenueGrowth > 0 && <TrendingUp className="h-4 w-4 text-success" />}
              {revenueGrowth < 0 && <TrendingDown className="h-4 w-4 text-destructive" />}
            </h3>
            
            {/* Texto dos insights */}
            <p className="text-foreground leading-relaxed">
              {insights.map((insight, i) => (
                <span key={i}>
                  {insight}{' '}
                  {/* Ícone de alerta para mensagens de atenção */}
                  {insight.includes('Atenção') && (
                    <AlertTriangle className="inline h-4 w-4 text-warning" />
                  )}
                </span>
              ))}
            </p>
            
            {/* Métricas complementares */}
            <div className="flex gap-4 pt-2 text-sm text-muted-foreground">
              <span>{totalSales.toLocaleString('pt-BR')} vendas</span>
              <span>•</span>
              <span>Ticket médio: {formatCurrency(avgTicket)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
