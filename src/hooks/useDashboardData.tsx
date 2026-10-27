/**
 * @fileoverview Hook de Dados do Dashboard - DrGeFin
 * 
 * Este é o hook mais complexo e central da aplicação. Ele busca e processa
 * todos os dados necessários para exibir o dashboard de vendas.
 * 
 * Funcionalidades:
 * - Métricas do período atual vs período anterior (para comparação)
 * - Ranking de produtos e vendedores por faturamento
 * - Análise por canal de venda e categoria
 * - Dados para gráficos de evolução temporal
 * - Análise de margem por produto e vendedor
 * - Ranking de clientes (concentração)
 * - Taxa de cancelamento
 * - Informações sobre importações ativas
 * 
 * IMPORTANTE: Todas as queries filtram por importações válidas (is_active=true, status='done')
 * para garantir que apenas dados consolidados sejam exibidos.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, parseISO } from 'date-fns';
import { useValidImportIds } from './useValidImportIds';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Métricas consolidadas de um período.
 * Usadas tanto para período atual quanto para comparação.
 */
interface PeriodMetrics {
  /** Receita total (soma de net_value) */
  totalRevenue: number;
  /** Quantidade total de vendas (linhas) */
  totalSales: number;
  /** Ticket médio (receita / quantidade) */
  avgTicket: number;
  /** Custo total (soma de cost_value) */
  totalCost: number;
  /** Margem percentual ((receita - custo) / receita * 100) */
  margin: number;
}

/**
 * Item de ranking genérico (produtos, vendedores).
 */
interface PerformerItem {
  /** Nome do item (produto ou vendedor) */
  name: string;
  /** Valor total (faturamento) */
  value: number;
  /** Margem percentual (opcional) */
  margin?: number;
  /** Desconto médio aplicado (opcional) */
  avgDiscount?: number;
}

/**
 * Item de ranking por margem.
 */
interface MarginItem {
  /** Nome do produto */
  name: string;
  /** Lucro bruto (receita - custo) */
  value: number;
  /** Margem percentual */
  margin: number;
}

/**
 * Item de vendedor com análise de margem e desconto.
 */
interface SellerMarginItem {
  /** Nome do vendedor */
  name: string;
  /** Faturamento total */
  value: number;
  /** Desconto médio concedido */
  avgDiscount: number;
  /** Contribuição para margem (lucro bruto) */
  marginContribution: number;
}

/**
 * Item de ranking de clientes.
 */
interface CustomerItem {
  /** Nome do cliente */
  name: string;
  /** Valor total comprado */
  value: number;
}

/**
 * Informações sobre importações ativas no dashboard.
 */
interface ActiveImportInfo {
  /** Quantidade de importações ativas */
  count: number;
  /** Lista de nomes dos arquivos importados */
  files: string[];
  /** Data mais antiga dos dados */
  startDate: string | null;
  /** Data mais recente dos dados */
  endDate: string | null;
  /** Se há sobreposição de períodos entre importações */
  hasOverlap: boolean;
}

/**
 * Item de canal de venda.
 */
interface ChannelItem {
  /** Nome do canal (Loja Física, E-commerce, etc.) */
  name: string;
  /** Total faturado pelo canal */
  total: number;
}

/**
 * Item de categoria de produto.
 */
interface CategoryItem {
  /** Nome da categoria */
  name: string;
  /** Total faturado pela categoria */
  total: number;
  /** Margem da categoria (opcional) */
  margin?: number;
}

/**
 * Ponto de dados para o gráfico de evolução.
 */
interface ChartDataPoint {
  /** Data no formato YYYY-MM-DD */
  date: string;
  /** Valor do período atual */
  value: number;
  /** Valor do período anterior (para comparação) */
  previousValue?: number;
}

/**
 * Interface completa dos dados retornados pelo hook.
 */
export interface DashboardData {
  /** Métricas do período atual */
  current: PeriodMetrics;
  /** Métricas do período anterior (para comparação) */
  previous: PeriodMetrics;
  /** Top produtos por faturamento */
  products: PerformerItem[];
  /** Top vendedores por faturamento */
  sellers: PerformerItem[];
  /** Faturamento por canal de venda */
  channels: ChannelItem[];
  /** Faturamento por categoria */
  categories: CategoryItem[];
  /** Dados para o gráfico de evolução diária */
  chartData: ChartDataPoint[];
  /** Indica se alguma query está carregando */
  isLoading: boolean;
  /** Data de referência (última venda) */
  referenceDate: string | null;
  /** Top produtos ordenados por margem */
  productsByMargin: MarginItem[];
  /** Top vendedores ordenados por contribuição de margem */
  sellersByMargin: SellerMarginItem[];
  /** Top clientes por volume */
  topCustomers: CustomerItem[];
  /** Informações sobre importações ativas */
  activeImport: ActiveImportInfo | null;
  /** Taxa de cancelamento (%) */
  cancellationRate: number;
  /** Quantidade de vendas canceladas */
  canceledCount: number;
  /** Total de vendas (incluindo canceladas) */
  totalSalesCount: number;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula as datas de início e fim para os períodos atual e anterior.
 * 
 * O período atual vai de (referenceDate - days + 1) até referenceDate.
 * O período anterior tem a mesma duração, imediatamente antes.
 * 
 * @param days - Quantidade de dias do período (7, 30, 90, etc.)
 * @param referenceDate - Data de referência (geralmente última venda)
 * @returns Objeto com datas de início e fim de ambos os períodos
 * 
 * @example
 * // Para 7 dias com referência em 2024-01-15
 * // current: 2024-01-09 a 2024-01-15
 * // previous: 2024-01-02 a 2024-01-08
 */
function calculatePeriodDates(days: number, referenceDate: Date) {
  const endDate = referenceDate;
  const startDate = subDays(endDate, days - 1);
  const prevEndDate = subDays(startDate, 1);
  const prevStartDate = subDays(prevEndDate, days - 1);

  return {
    current: {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd'),
    },
    previous: {
      start: format(prevStartDate, 'yyyy-MM-dd'),
      end: format(prevEndDate, 'yyyy-MM-dd'),
    },
  };
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook principal para carregar todos os dados do dashboard.
 * 
 * Faz múltiplas queries em paralelo para buscar:
 * - Métricas agregadas (período atual e anterior)
 * - Rankings (produtos, vendedores, clientes)
 * - Dados para gráficos
 * - Informações de importações
 * 
 * IMPORTANTE: Usa useValidImportIds para filtrar apenas dados de
 * importações concluídas e ativas.
 * 
 * @param tenantId - ID do tenant para filtrar dados
 * @param periodDays - Quantidade de dias do período (7, 30, 90, etc.)
 * @returns Objeto DashboardData com todos os dados e estado de loading
 * 
 * @example
 * const dashboardData = useDashboardData(tenant?.id, 30);
 * 
 * if (dashboardData.isLoading) {
 *   return <Skeleton />;
 * }
 * 
 * console.log('Faturamento:', dashboardData.current.totalRevenue);
 */
export function useDashboardData(tenantId: string | undefined, periodDays: number): DashboardData {
  // ============================================================================
  // BUSCA IDS DE IMPORTAÇÕES VÁLIDAS
  // ============================================================================
  
  // Primeiro, busca os IDs das importações válidas (status=done AND is_active=true)
  // Todas as outras queries dependem destes IDs para filtrar corretamente
  const { data: validImportIds = [], isLoading: isLoadingImports } = useValidImportIds(tenantId);

  // ============================================================================
  // BUSCA DATA DE REFERÊNCIA
  // ============================================================================
  
  /**
   * Busca a data da última venda no sistema.
   * Esta data é usada como referência para calcular os períodos.
   * Isso garante que o dashboard sempre mostre dados relevantes,
   * mesmo que não haja vendas recentes.
   */
  const { data: lastSaleDate } = useQuery({
    queryKey: ['dashboard-last-date', tenantId, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return null;
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('sale_date')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .order('sale_date', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0]?.sale_date || null;
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // Calcula datas dos períodos baseado na referência
  const referenceDate = lastSaleDate ? parseISO(lastSaleDate) : new Date();
  const dates = calculatePeriodDates(periodDays, referenceDate);

  // ============================================================================
  // MÉTRICAS DO PERÍODO ATUAL
  // ============================================================================
  
  /**
   * Busca métricas agregadas do período atual.
   * Exclui vendas canceladas/devolvidas dos cálculos de receita.
   */
  const { data: currentMetrics, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['dashboard-current', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return null;
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('net_value, cost_value, status')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end);

      if (error) throw error;

      // Filtra vendas canceladas/devolvidas para cálculo de receita
      const activeSales = (data || []).filter(row => 
        !row.status || !['canceled', 'refunded', 'returned'].includes(row.status)
      );

      // Calcula métricas agregadas
      const totalRevenue = activeSales.reduce((sum, row) => sum + (row.net_value || 0), 0);
      const totalCost = activeSales.reduce((sum, row) => sum + (row.cost_value || 0), 0);
      const totalSales = activeSales.length;
      const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
      const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

      return { totalRevenue, totalSales, avgTicket, totalCost, margin };
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // MÉTRICAS DO PERÍODO ANTERIOR
  // ============================================================================
  
  /**
   * Busca métricas do período anterior para comparação.
   * Usa a mesma lógica do período atual.
   */
  const { data: previousMetrics, isLoading: isLoadingPrevious } = useQuery({
    queryKey: ['dashboard-previous', tenantId, dates.previous, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return null;
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('net_value, cost_value, status')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.previous.start)
        .lte('sale_date', dates.previous.end);

      if (error) throw error;

      // Filtra vendas canceladas/devolvidas
      const activeSales = (data || []).filter(row => 
        !row.status || !['canceled', 'refunded', 'returned'].includes(row.status)
      );

      const totalRevenue = activeSales.reduce((sum, row) => sum + (row.net_value || 0), 0);
      const totalCost = activeSales.reduce((sum, row) => sum + (row.cost_value || 0), 0);
      const totalSales = activeSales.length;
      const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
      const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

      return { totalRevenue, totalSales, avgTicket, totalCost, margin };
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // TAXA DE CANCELAMENTO
  // ============================================================================
  
  /**
   * Calcula a taxa de cancelamento do período.
   * Considera status: canceled, refunded, returned.
   */
  const { data: cancellationData } = useQuery({
    queryKey: ['dashboard-cancellation', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return { canceledCount: 0, totalCount: 0 };
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('status')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end);

      if (error) throw error;

      const totalCount = data?.length || 0;
      const canceledCount = (data || []).filter(row => 
        row.status && ['canceled', 'refunded', 'returned'].includes(row.status)
      ).length;

      return { canceledCount, totalCount };
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // TOP PRODUTOS POR FATURAMENTO
  // ============================================================================
  
  /**
   * Busca os 5 produtos com maior faturamento no período.
   */
  const { data: products } = useQuery({
    queryKey: ['dashboard-products', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('product_name, net_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end)
        .not('product_name', 'is', null);

      if (error) throw error;

      // Agrupa por produto e soma valores
      const grouped = (data || []).reduce((acc, row) => {
        const name = row.product_name || 'Sem nome';
        acc[name] = (acc[name] || 0) + (row.net_value || 0);
        return acc;
      }, {} as Record<string, number>);

      // Ordena e retorna top 5
      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // TOP VENDEDORES POR FATURAMENTO
  // ============================================================================
  
  /**
   * Busca os 5 vendedores com maior faturamento no período.
   */
  const { data: sellers } = useQuery({
    queryKey: ['dashboard-sellers', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('seller_name, net_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end)
        .not('seller_name', 'is', null);

      if (error) throw error;

      // Agrupa por vendedor e soma valores
      const grouped = (data || []).reduce((acc, row) => {
        const name = row.seller_name || 'Sem nome';
        acc[name] = (acc[name] || 0) + (row.net_value || 0);
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // FATURAMENTO POR CANAL
  // ============================================================================
  
  /**
   * Busca o faturamento agrupado por canal de venda.
   * Usado para o gráfico de pizza/donut.
   */
  const { data: channels } = useQuery({
    queryKey: ['dashboard-channels', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('channel, net_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end)
        .not('channel', 'is', null);

      if (error) throw error;

      // Agrupa por canal
      const grouped = (data || []).reduce((acc, row) => {
        const name = row.channel || 'Outros';
        acc[name] = (acc[name] || 0) + (row.net_value || 0);
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // FATURAMENTO POR CATEGORIA
  // ============================================================================
  
  /**
   * Busca o faturamento e margem agrupados por categoria.
   */
  const { data: categories } = useQuery({
    queryKey: ['dashboard-categories', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('category, net_value, cost_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end)
        .not('category', 'is', null);

      if (error) throw error;

      // Agrupa por categoria, somando receita e custo
      const grouped = (data || []).reduce((acc, row) => {
        const name = row.category || 'Outros';
        if (!acc[name]) acc[name] = { total: 0, cost: 0 };
        acc[name].total += row.net_value || 0;
        acc[name].cost += row.cost_value || 0;
        return acc;
      }, {} as Record<string, { total: number; cost: number }>);

      // Calcula margem para cada categoria
      return Object.entries(grouped)
        .map(([name, { total, cost }]) => ({
          name,
          total,
          margin: total > 0 ? ((total - cost) / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // DADOS PARA GRÁFICO DE EVOLUÇÃO
  // ============================================================================
  
  /**
   * Busca dados diários para o gráfico de evolução.
   * Inclui período atual e anterior para comparação visual.
   */
  const { data: chartData } = useQuery({
    queryKey: ['dashboard-chart', tenantId, dates.current, dates.previous, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      // Busca dados do período atual
      const { data: currentData, error: currentError } = await supabase
        .from('sales_lines')
        .select('sale_date, net_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end);

      if (currentError) throw currentError;

      // Busca dados do período anterior
      const { data: previousData, error: previousError } = await supabase
        .from('sales_lines')
        .select('sale_date, net_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.previous.start)
        .lte('sale_date', dates.previous.end);

      if (previousError) throw previousError;

      // Agrupa dados do período atual por data
      const currentGrouped = (currentData || []).reduce((acc, row) => {
        const date = row.sale_date;
        acc[date] = (acc[date] || 0) + (row.net_value || 0);
        return acc;
      }, {} as Record<string, number>);

      // Agrupa dados do período anterior por data
      const previousGrouped = (previousData || []).reduce((acc, row) => {
        const date = row.sale_date;
        acc[date] = (acc[date] || 0) + (row.net_value || 0);
        return acc;
      }, {} as Record<string, number>);

      // Alinha os períodos para comparação visual
      const previousDates = Object.keys(previousGrouped).sort();
      const currentDates = Object.keys(currentGrouped).sort();

      return currentDates.map((date, index) => ({
        date,
        value: currentGrouped[date] || 0,
        previousValue: previousDates[index] ? previousGrouped[previousDates[index]] : undefined,
      }));
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // PRODUTOS POR MARGEM (ANÁLISE AVANÇADA)
  // ============================================================================
  
  /**
   * Busca os 10 produtos com maior margem percentual.
   * Útil para identificar produtos mais rentáveis.
   */
  const { data: productsByMargin } = useQuery({
    queryKey: ['dashboard-products-margin', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('product_name, net_value, cost_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end)
        .not('product_name', 'is', null);

      if (error) throw error;

      // Agrupa por produto, acumulando receita e custo
      const grouped = (data || []).reduce((acc, row) => {
        const name = row.product_name || 'Sem nome';
        if (!acc[name]) acc[name] = { revenue: 0, cost: 0 };
        acc[name].revenue += row.net_value || 0;
        acc[name].cost += row.cost_value || 0;
        return acc;
      }, {} as Record<string, { revenue: number; cost: number }>);

      // Calcula margem e ordena
      return Object.entries(grouped)
        .map(([name, { revenue, cost }]) => ({
          name,
          value: revenue - cost, // Lucro bruto
          margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
        }))
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 10);
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // VENDEDORES POR MARGEM E DESCONTO (ANÁLISE AVANÇADA)
  // ============================================================================
  
  /**
   * Busca os 10 vendedores com maior contribuição de margem.
   * Inclui média de desconto concedido para análise de comportamento.
   */
  const { data: sellersByMargin } = useQuery({
    queryKey: ['dashboard-sellers-margin', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('seller_name, net_value, cost_value, discount_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end)
        .not('seller_name', 'is', null);

      if (error) throw error;

      // Agrupa por vendedor
      const grouped = (data || []).reduce((acc, row) => {
        const name = row.seller_name || 'Sem nome';
        if (!acc[name]) acc[name] = { revenue: 0, cost: 0, discount: 0, count: 0 };
        acc[name].revenue += row.net_value || 0;
        acc[name].cost += row.cost_value || 0;
        acc[name].discount += row.discount_value || 0;
        acc[name].count += 1;
        return acc;
      }, {} as Record<string, { revenue: number; cost: number; discount: number; count: number }>);

      // Calcula métricas e ordena por contribuição de margem
      return Object.entries(grouped)
        .map(([name, { revenue, cost, discount, count }]) => ({
          name,
          value: revenue,
          avgDiscount: count > 0 ? discount / count : 0,
          marginContribution: revenue - cost,
        }))
        .sort((a, b) => b.marginContribution - a.marginContribution)
        .slice(0, 10);
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // TOP CLIENTES (ANÁLISE DE CONCENTRAÇÃO)
  // ============================================================================
  
  /**
   * Busca os 10 maiores clientes por volume de compras.
   * Útil para análise de concentração de receita.
   */
  const { data: topCustomers } = useQuery({
    queryKey: ['dashboard-customers', tenantId, dates.current, validImportIds],
    queryFn: async () => {
      if (!tenantId || validImportIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('sales_lines')
        .select('customer_name, net_value')
        .eq('tenant_id', tenantId)
        .in('import_run_id', validImportIds)
        .gte('sale_date', dates.current.start)
        .lte('sale_date', dates.current.end)
        .not('customer_name', 'is', null);

      if (error) throw error;

      // Agrupa por cliente
      const grouped = (data || []).reduce((acc, row) => {
        const name = row.customer_name || 'Sem nome';
        acc[name] = (acc[name] || 0) + (row.net_value || 0);
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    },
    enabled: !!tenantId && validImportIds.length > 0,
  });

  // ============================================================================
  // INFORMAÇÕES DE IMPORTAÇÕES ATIVAS
  // ============================================================================
  
  /**
   * Busca informações sobre todas as importações ativas.
   * Detecta sobreposição de períodos que pode indicar duplicação de dados.
   */
  const { data: activeImport } = useQuery({
    queryKey: ['dashboard-active-import', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase
        .from('import_runs')
        .select('id, original_filename, detected_start_date, detected_end_date')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('status', 'done')
        .order('detected_start_date', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const files = data.map(d => d.original_filename).filter(Boolean) as string[];
        const startDates = data.map(d => d.detected_start_date).filter(Boolean) as string[];
        const endDates = data.map(d => d.detected_end_date).filter(Boolean) as string[];
        
        // Detecta sobreposição entre períodos das importações
        // Se houver sobreposição, pode haver duplicação de dados
        let hasOverlap = false;
        for (let i = 0; i < data.length && !hasOverlap; i++) {
          for (let j = i + 1; j < data.length; j++) {
            const aStart = data[i].detected_start_date;
            const aEnd = data[i].detected_end_date;
            const bStart = data[j].detected_start_date;
            const bEnd = data[j].detected_end_date;
            if (aStart && aEnd && bStart && bEnd) {
              // Há sobreposição se: aStart <= bEnd AND aEnd >= bStart
              if (aStart <= bEnd && aEnd >= bStart) {
                hasOverlap = true;
                break;
              }
            }
          }
        }

        return {
          count: data.length,
          files,
          startDate: startDates.length > 0 ? startDates[0] : null,
          endDate: endDates.length > 0 ? endDates[endDates.length - 1] : null,
          hasOverlap,
        };
      }
      return null;
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================

  // Métricas padrão quando não há dados
  const defaultMetrics: PeriodMetrics = {
    totalRevenue: 0,
    totalSales: 0,
    avgTicket: 0,
    totalCost: 0,
    margin: 0,
  };

  // Calcula taxa de cancelamento
  const canceledCount = cancellationData?.canceledCount || 0;
  const totalSalesCount = cancellationData?.totalCount || 0;
  const cancellationRate = totalSalesCount > 0 ? (canceledCount / totalSalesCount) * 100 : 0;

  return {
    // Métricas principais
    current: currentMetrics || defaultMetrics,
    previous: previousMetrics || defaultMetrics,
    
    // Rankings básicos
    products: products || [],
    sellers: sellers || [],
    channels: channels || [],
    categories: categories || [],
    
    // Gráfico
    chartData: chartData || [],
    
    // Estado e referência
    isLoading: isLoadingImports || isLoadingCurrent || isLoadingPrevious,
    referenceDate: lastSaleDate || null,
    
    // Análises avançadas
    productsByMargin: productsByMargin || [],
    sellersByMargin: sellersByMargin || [],
    topCustomers: topCustomers || [],
    activeImport: activeImport || null,
    
    // Métricas de cancelamento
    cancellationRate,
    canceledCount,
    totalSalesCount,
  };
}
