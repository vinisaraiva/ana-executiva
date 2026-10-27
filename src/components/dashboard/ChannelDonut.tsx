/**
 * @fileoverview Gráfico de Rosca - Mix de Canais de Venda - DrGeFin
 * 
 * Componente que exibe gráfico de rosca (donut) mostrando
 * a distribuição de vendas por canal.
 * 
 * Funcionalidades:
 * - Gráfico de rosca com cores distintas por canal
 * - Legenda com percentuais ao lado do gráfico
 * - Tooltip com valores em BRL
 * - Retorna null quando não há dados (não renderiza nada)
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Store } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de dados de um canal de vendas.
 */
interface ChannelData {
  /** Nome do canal (ex: "E-commerce", "Loja Física") */
  name: string;
  /** Valor total de vendas no canal */
  value: number;
}

/**
 * Propriedades do componente ChannelDonut.
 */
interface ChannelDonutProps {
  /** Array de dados por canal */
  data: ChannelData[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Paleta de cores para os segmentos do gráfico.
 * Cores em HSL para consistência com o design system.
 */
const COLORS = [
  'hsl(217, 91%, 60%)',   // primary - azul
  'hsl(172, 66%, 50%)',   // accent - verde água
  'hsl(142, 76%, 36%)',   // success - verde
  'hsl(38, 92%, 50%)',    // warning - amarelo/laranja
  'hsl(215, 16%, 47%)',   // muted - cinza
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Gráfico de rosca mostrando mix de canais de venda.
 * 
 * Exibe a distribuição percentual de vendas por canal
 * com gráfico de rosca e legenda lateral.
 * 
 * @example
 * ```tsx
 * <ChannelDonut
 *   data={[
 *     { name: 'E-commerce', value: 50000 },
 *     { name: 'Loja Física', value: 30000 },
 *     { name: 'Marketplace', value: 20000 },
 *   ]}
 * />
 * ```
 */
export function ChannelDonut({ data }: ChannelDonutProps) {
  // Calcula o total para cálculo de percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  /**
   * Formata valor numérico como moeda brasileira.
   * @param value - Valor a ser formatado
   * @returns String formatada (ex: "R$ 50.000,00")
   */
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Não renderiza se não houver dados
  if (!data.length || total === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Store className="h-4 w-4 text-accent" />
          Mix de Canais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Gráfico de rosca */}
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {/* Células coloridas para cada segmento */}
                  {data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                {/* Tooltip com valor formatado */}
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legenda lateral com percentuais */}
          <div className="flex-1 space-y-2">
            {data.slice(0, 5).map((channel, index) => (
              <div key={channel.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {/* Indicador de cor */}
                  <div 
                    className="h-2.5 w-2.5 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {/* Nome do canal (truncado se muito longo) */}
                  <span className="truncate max-w-[100px]">{channel.name}</span>
                </div>
                {/* Percentual do canal */}
                <span className="text-muted-foreground font-medium">
                  {((channel.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
