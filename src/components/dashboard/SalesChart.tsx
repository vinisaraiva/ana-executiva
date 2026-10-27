/**
 * @fileoverview Gráfico de Vendas por Período - DrGeFin
 * 
 * Componente que exibe gráfico de barras com faturamento por período.
 * 
 * Funcionalidades:
 * - Gráfico de barras com valores em BRL
 * - Opção de comparação com período anterior (área tracejada)
 * - Tooltip com valores formatados
 * - Estado vazio quando não há dados
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um ponto de dados do gráfico.
 */
interface ChartDataPoint {
  /** Data do ponto (será formatada para exibição) */
  date: string;
  /** Valor do período atual */
  value: number;
  /** Valor do período anterior (opcional, para comparação) */
  previousValue?: number;
}

/**
 * Propriedades do componente SalesChart.
 */
interface SalesChartProps {
  /** Array de pontos de dados para o gráfico */
  data: ChartDataPoint[];
  /** Título do gráfico */
  title?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Gráfico de vendas/faturamento por período.
 * 
 * Exibe gráfico de barras com valores do período atual e
 * opcionalmente uma área tracejada com valores do período anterior
 * para comparação.
 * 
 * @example
 * ```tsx
 * <SalesChart
 *   data={[
 *     { date: '2024-01-01', value: 15000, previousValue: 12000 },
 *     { date: '2024-01-02', value: 18000, previousValue: 14000 },
 *   ]}
 *   title="Faturamento por Período"
 * />
 * ```
 */
export function SalesChart({ data, title = 'Vendas por Período' }: SalesChartProps) {
  // Estado para controlar exibição da comparação com período anterior
  const [showComparison, setShowComparison] = useState(false);

  /**
   * Formata valor numérico como moeda brasileira compacta.
   * @param value - Valor a ser formatado
   * @returns String formatada (ex: "R$ 15K")
   */
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' });

  /**
   * Formata data para exibição no eixo X.
   * @param date - Data em formato ISO
   * @returns String formatada (ex: "15 jan")
   */
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Estado vazio - exibe mensagem quando não há dados
  if (!data.length) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado disponível</p>
              <p className="text-sm">Faça uma importação para ver os gráficos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verifica se há dados de período anterior para comparação
  const hasComparison = data.some(d => d.previousValue !== undefined);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        {/* Botão de toggle para comparação (só aparece se houver dados) */}
        {hasComparison && (
          <Button
            variant={showComparison ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            className="text-xs h-7"
          >
            vs Anterior
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {/* Grid de fundo */}
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            
            {/* Eixo X - Datas */}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            
            {/* Eixo Y - Valores */}
            <YAxis 
              tickFormatter={(v) => formatCurrency(v)}
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              width={60}
            />
            
            {/* Tooltip customizado */}
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
              }}
            />
            
            {/* Área do período anterior (quando comparação está ativa) */}
            {showComparison && hasComparison && (
              <Area
                type="monotone"
                dataKey="previousValue"
                fill="hsl(var(--muted))"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                fillOpacity={0.3}
                name="Período anterior"
              />
            )}
            
            {/* Barras do período atual */}
            <Bar
              dataKey="value"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="Atual"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
