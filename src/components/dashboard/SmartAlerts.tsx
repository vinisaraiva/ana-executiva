/**
 * @fileoverview Alertas Inteligentes - DrGeFin
 * 
 * Componente que analisa os dados e gera alertas automáticos:
 * 
 * Tipos de alerta:
 * - opportunity (verde): Oportunidades de crescimento
 * - warning (amarelo): Pontos de atenção
 * - insight (azul): Informações relevantes
 * - risk (vermelho): Riscos identificados
 * 
 * Análises realizadas:
 * - Taxa de cancelamento
 * - Concentração de canais
 * - Concentração de clientes (dependência)
 * - Concentração de produtos
 * - Margens por categoria
 * - Variação do ticket médio
 * - Performance de vendedores
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Zap, Users, Package, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um alerta gerado.
 */
interface Alert {
  /** Tipo do alerta (define cor e ícone) */
  type: 'opportunity' | 'warning' | 'insight' | 'risk';
  /** Mensagem descritiva do alerta */
  message: string;
  /** Label curta do tipo de métrica */
  metric?: string;
}

/**
 * Estrutura de um cliente no ranking.
 */
interface CustomerItem {
  name: string;
  value: number;
}

/**
 * Propriedades do componente SmartAlerts.
 */
interface SmartAlertsProps {
  /** Dados de canais de venda */
  channels?: Array<{ name: string; total: number; percentage?: number }>;
  /** Dados de categorias */
  categories?: Array<{ name: string; total: number; margin?: number }>;
  /** Dados de vendedores */
  sellers?: Array<{ name: string; total: number }>;
  /** Dados de produtos */
  products?: Array<{ name: string; value: number }>;
  /** Dados de clientes */
  customers?: CustomerItem[];
  /** Ticket médio atual */
  avgTicket?: number;
  /** Ticket médio do período anterior */
  previousAvgTicket?: number;
  /** Receita total do período */
  totalRevenue?: number;
  /** Taxa de cancelamento (%) */
  cancellationRate?: number;
  /** Quantidade de vendas canceladas */
  canceledCount?: number;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de alertas inteligentes.
 * 
 * Analisa automaticamente os dados fornecidos e gera alertas
 * categorizados para ajudar o usuário a identificar oportunidades,
 * riscos e pontos de atenção.
 * 
 * @example
 * ```tsx
 * <SmartAlerts
 *   channels={channelData}
 *   categories={categoryData}
 *   avgTicket={150}
 *   previousAvgTicket={120}
 *   cancellationRate={5.5}
 *   canceledCount={12}
 * />
 * ```
 */
export function SmartAlerts({
  channels = [],
  categories = [],
  sellers = [],
  products = [],
  customers = [],
  avgTicket = 0,
  previousAvgTicket = 0,
  totalRevenue = 0,
  cancellationRate = 0,
  canceledCount = 0,
}: SmartAlertsProps) {
  // Array para acumular alertas gerados
  const alerts: Alert[] = [];

  // ================================
  // ANÁLISE: Taxa de cancelamento
  // ================================
  if (cancellationRate > 0 && canceledCount > 0) {
    if (cancellationRate > 10) {
      // Taxa crítica (> 10%)
      alerts.push({
        type: 'risk',
        message: `Taxa de cancelamento crítica: ${cancellationRate.toFixed(1)}% (${canceledCount} vendas)`,
        metric: 'Cancelamentos',
      });
    } else if (cancellationRate > 5) {
      // Taxa alta (5-10%)
      alerts.push({
        type: 'warning',
        message: `Taxa de cancelamento alta: ${cancellationRate.toFixed(1)}% (${canceledCount} vendas)`,
        metric: 'Cancelamentos',
      });
    } else if (cancellationRate > 2) {
      // Taxa moderada (2-5%)
      alerts.push({
        type: 'insight',
        message: `Taxa de cancelamento: ${cancellationRate.toFixed(1)}% (${canceledCount} vendas)`,
        metric: 'Cancelamentos',
      });
    }
  }

  // ================================
  // ANÁLISE: Concentração de canais
  // ================================
  const topChannel = channels[0];
  if (topChannel && channels.length > 1) {
    const channelTotal = channels.reduce((s, c) => s + c.total, 0);
    const secondChannel = channels[1];
    const topShare = channelTotal > 0 ? (topChannel.total / channelTotal) * 100 : 0;
    
    // Alerta se um canal domina mais de 50%
    if (topShare > 50) {
      alerts.push({
        type: 'insight',
        message: `${topChannel.name} representa ${topShare.toFixed(0)}% das vendas`,
        metric: 'Concentração de canal',
      });
    }
    
    // Oportunidade de diversificação
    if (topChannel.total > secondChannel.total * 2) {
      alerts.push({
        type: 'opportunity',
        message: `Considere investir mais em ${secondChannel.name} para diversificar`,
        metric: 'Oportunidade de crescimento',
      });
    }
  }

  // ================================
  // ANÁLISE: Concentração de clientes
  // ================================
  if (customers.length > 0 && totalRevenue > 0) {
    const top5CustomersValue = customers.slice(0, 5).reduce((s, c) => s + c.value, 0);
    const top5Concentration = (top5CustomersValue / totalRevenue) * 100;
    
    // Risco se top 5 clientes > 50% da receita
    if (top5Concentration > 50) {
      alerts.push({
        type: 'risk',
        message: `Top 5 clientes representam ${top5Concentration.toFixed(0)}% da receita - risco de dependência`,
        metric: 'Concentração de clientes',
      });
    } else if (top5Concentration > 30) {
      alerts.push({
        type: 'warning',
        message: `Top 5 clientes representam ${top5Concentration.toFixed(0)}% da receita`,
        metric: 'Concentração de clientes',
      });
    }

    // Risco de dependência de um único cliente
    const topCustomer = customers[0];
    const topCustomerShare = (topCustomer.value / totalRevenue) * 100;
    if (topCustomerShare > 20) {
      alerts.push({
        type: 'risk',
        message: `Cliente "${topCustomer.name.substring(0, 20)}..." representa ${topCustomerShare.toFixed(0)}% da receita`,
        metric: 'Dependência de cliente',
      });
    }
  }

  // ================================
  // ANÁLISE: Concentração de produtos
  // ================================
  if (products.length > 0 && totalRevenue > 0) {
    const top5ProductsValue = products.slice(0, 5).reduce((s, p) => s + p.value, 0);
    const top5ProductConcentration = (top5ProductsValue / totalRevenue) * 100;
    
    if (top5ProductConcentration > 70) {
      alerts.push({
        type: 'warning',
        message: `Top 5 produtos representam ${top5ProductConcentration.toFixed(0)}% do faturamento`,
        metric: 'Concentração de produtos',
      });
    }
  }

  // ================================
  // ANÁLISE: Margens por categoria
  // ================================
  const lowMarginCategory = categories.find(c => c.margin !== undefined && c.margin < 10);
  if (lowMarginCategory) {
    alerts.push({
      type: 'warning',
      message: `${lowMarginCategory.name} tem margem baixa de ${lowMarginCategory.margin?.toFixed(1)}%`,
      metric: 'Atenção na margem',
    });
  }

  const highMarginCategory = categories.find(c => c.margin !== undefined && c.margin > 30);
  if (highMarginCategory) {
    alerts.push({
      type: 'opportunity',
      message: `${highMarginCategory.name} tem ótima margem de ${highMarginCategory.margin?.toFixed(1)}%`,
      metric: 'Produto estrela',
    });
  }

  // ================================
  // ANÁLISE: Variação do ticket médio
  // ================================
  if (previousAvgTicket > 0 && avgTicket > 0) {
    const ticketVariation = ((avgTicket - previousAvgTicket) / previousAvgTicket) * 100;
    if (ticketVariation > 10) {
      alerts.push({
        type: 'opportunity',
        message: `Ticket médio cresceu ${ticketVariation.toFixed(0)}% - mantenha a estratégia`,
        metric: 'Ticket em alta',
      });
    } else if (ticketVariation < -10) {
      alerts.push({
        type: 'warning',
        message: `Ticket médio caiu ${Math.abs(ticketVariation).toFixed(0)}% - revisar preços`,
        metric: 'Ticket em queda',
      });
    }
  }

  // ================================
  // ANÁLISE: Performance de vendedores
  // ================================
  if (sellers.length >= 3) {
    const avgSales = sellers.reduce((s, sel) => s + sel.total, 0) / sellers.length;
    const lowPerformers = sellers.filter(s => s.total < avgSales * 0.7);
    if (lowPerformers.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowPerformers.length} vendedor(es) abaixo de 70% da média`,
        metric: 'Performance de equipe',
      });
    }
  }

  // Não renderiza se não houver alertas
  if (alerts.length === 0) {
    return null;
  }

  /**
   * Retorna o ícone apropriado para o tipo de alerta.
   */
  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'insight':
        return <Zap className="h-4 w-4" />;
      case 'risk':
        return <Users className="h-4 w-4" />;
    }
  };

  /**
   * Retorna as classes CSS para estilização do alerta.
   */
  const getStyles = (type: Alert['type']) => {
    switch (type) {
      case 'opportunity':
        return 'bg-success/10 border-success/20 text-success';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'insight':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'risk':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          Insights e Oportunidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Grid de alertas (máximo 6) */}
        <div className="grid gap-2 sm:grid-cols-2">
          {alerts.slice(0, 6).map((alert, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                getStyles(alert.type)
              )}
            >
              {/* Ícone do alerta */}
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                {/* Label da métrica */}
                <p className="text-xs font-medium opacity-70">{alert.metric}</p>
                {/* Mensagem do alerta */}
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
