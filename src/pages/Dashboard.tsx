/**
 * @fileoverview Dashboard Principal - DrGeFin
 * 
 * Página principal do sistema que exibe:
 * - KPIs (Faturamento, Vendas, Ticket Médio, Margem)
 * - Gráficos de vendas por período
 * - Mix de canais de venda
 * - Rankings de produtos e vendedores
 * - Alertas inteligentes
 * - Histórico de importações e anomalias
 * 
 * Esta página é o centro de comando do usuário para visualizar
 * a saúde financeira do negócio de forma rápida e intuitiva.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  FileUp, 
  ArrowRight, 
  TrendingUp,
  Receipt,
  Percent
} from 'lucide-react';

// Componentes do dashboard
import { InsightSummary } from '@/components/dashboard/InsightSummary';
import { KPICard } from '@/components/dashboard/KPICard';
import { TopPerformers } from '@/components/dashboard/TopPerformers';
import { ChannelDonut } from '@/components/dashboard/ChannelDonut';
import { SmartAlerts } from '@/components/dashboard/SmartAlerts';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { MarginRanking } from '@/components/dashboard/MarginRanking';
import { ActiveImportBanner } from '@/components/dashboard/ActiveImportBanner';
import { useDashboardData } from '@/hooks/useDashboardData';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Dashboard principal do DrGeFin.
 * 
 * Exibe visão consolidada de todos os dados financeiros do tenant,
 * incluindo KPIs, gráficos, rankings e alertas inteligentes.
 * 
 * O período de análise pode ser alterado pelo usuário (7, 30 ou 90 dias).
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  
  // Estado para controlar o período de análise selecionado
  const [periodDays, setPeriodDays] = useState<number>(30);

  // Hook customizado que busca e processa todos os dados do dashboard
  const dashboardData = useDashboardData(tenant?.id, periodDays);

  // Busca as últimas 5 importações do tenant para exibir no histórico
  const { data: importRuns } = useQuery({
    queryKey: ['import-runs', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase
        .from('import_runs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!tenant,
  });

  // Busca as últimas 5 anomalias detectadas para exibir nos alertas
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase
        .from('anomalies')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!tenant,
  });

  /**
   * Formata valor numérico como moeda brasileira (BRL).
   * @param value - Valor numérico a ser formatado
   * @returns String formatada em moeda (ex: "R$ 1.234,56")
   */
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Identifica o canal de vendas com melhor performance para destaque
  const topChannel = dashboardData.channels.length > 0 
    ? { name: dashboardData.channels[0].name, growth: 15 } 
    : undefined;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Banner de importação ativa - mostra qual arquivo está sendo usado */}
        <ActiveImportBanner activeImport={dashboardData.activeImport} />

        {/* Seção: Ações rápidas e seletor de período */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-4">
            {/* Botão para iniciar nova importação */}
            <Button onClick={() => navigate('/app/imports/new')} className="gap-2">
              <FileUp className="h-4 w-4" />
              Nova Importação
            </Button>
            {/* Atalho para o chat com IA */}
            <Button variant="outline" onClick={() => navigate('/app/chat')} className="gap-2">
              Ir para Chat IA
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Seletor de período de análise (7, 30 ou 90 dias) */}
          <PeriodSelector 
            value={periodDays} 
            onChange={setPeriodDays} 
            referenceDate={dashboardData.referenceDate}
          />
        </div>

        {/* Seção: Resumo inteligente com insights principais */}
        <InsightSummary
          totalRevenue={dashboardData.current.totalRevenue}
          totalSales={dashboardData.current.totalSales}
          avgTicket={dashboardData.current.avgTicket}
          previousRevenue={dashboardData.previous.totalRevenue}
          topChannel={topChannel}
        />

        {/* Seção: Grid de KPIs principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* KPI: Faturamento Total */}
          <KPICard
            title="Faturamento Total"
            value={formatCurrency(dashboardData.current.totalRevenue)}
            currentValue={dashboardData.current.totalRevenue}
            previousValue={dashboardData.previous.totalRevenue}
            icon={DollarSign}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          {/* KPI: Total de Vendas */}
          <KPICard
            title="Total de Vendas"
            value={dashboardData.current.totalSales.toLocaleString('pt-BR')}
            currentValue={dashboardData.current.totalSales}
            previousValue={dashboardData.previous.totalSales}
            icon={ShoppingCart}
            iconColor="text-accent"
            iconBgColor="bg-accent/10"
          />
          {/* KPI: Ticket Médio */}
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(dashboardData.current.avgTicket)}
            currentValue={dashboardData.current.avgTicket}
            previousValue={dashboardData.previous.avgTicket}
            icon={Receipt}
            iconColor="text-success"
            iconBgColor="bg-success/10"
          />
          {/* KPI: Margem Bruta */}
          <KPICard
            title="Margem Bruta"
            value={`${dashboardData.current.margin.toFixed(1)}%`}
            currentValue={dashboardData.current.margin}
            previousValue={dashboardData.previous.margin}
            icon={Percent}
            iconColor="text-warning"
            iconBgColor="bg-warning/10"
          />
        </div>

        {/* Seção: Gráficos - Vendas por período e Mix de canais */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart data={dashboardData.chartData} title="Faturamento por Período" />
          </div>
          <ChannelDonut data={dashboardData.channels.map(c => ({ name: c.name, value: c.total }))} />
        </div>

        {/* Seção: Rankings - Produtos/Vendedores e Margem */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TopPerformers
            products={dashboardData.products.length > 0 
              ? dashboardData.products 
              : dashboardData.categories.map(c => ({ name: c.name, value: c.total }))}
            sellers={dashboardData.sellers}
          />
          <MarginRanking
            productsByMargin={dashboardData.productsByMargin}
            sellersByMargin={dashboardData.sellersByMargin}
          />
        </div>

        {/* Seção: Alertas inteligentes com insights e oportunidades */}
        <SmartAlerts
          channels={dashboardData.channels}
          categories={dashboardData.categories}
          sellers={dashboardData.sellers.map(s => ({ name: s.name, total: s.value }))}
          products={dashboardData.products}
          customers={dashboardData.topCustomers}
          avgTicket={dashboardData.current.avgTicket}
          previousAvgTicket={dashboardData.previous.avgTicket}
          totalRevenue={dashboardData.current.totalRevenue}
          cancellationRate={dashboardData.cancellationRate}
          canceledCount={dashboardData.canceledCount}
        />

        {/* Seção: Atividade recente - Importações e Alertas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card: Últimas Importações */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Últimas Importações</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/imports')}>
                Ver todas
              </Button>
            </CardHeader>
            <CardContent>
              {importRuns && importRuns.length > 0 ? (
                <div className="space-y-3">
                  {importRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/imports/${run.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {run.original_filename || 'Arquivo sem nome'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(run.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={run.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma importação ainda</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Alertas Recentes */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Alertas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anomalies && anomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.slice(0, 4).map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20"
                    >
                      <SeverityIndicator severity={anomaly.severity} />
                      <div>
                        <p className="text-sm font-medium">{anomaly.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(anomaly.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhum alerta ativo</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Badge que exibe o status de uma importação.
 * 
 * @param status - Status da importação (queued, processing, done, failed, canceled)
 */
function StatusBadge({ status }: { status: string }) {
  // Configuração de cores e labels para cada status
  const statusConfig: Record<string, { label: string; className: string }> = {
    queued: { label: 'Na fila', className: 'bg-muted text-muted-foreground' },
    processing: { label: 'Processando', className: 'bg-primary/10 text-primary' },
    done: { label: 'Concluído', className: 'bg-success/10 text-success' },
    failed: { label: 'Erro', className: 'bg-destructive/10 text-destructive' },
    canceled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  };

  const config = statusConfig[status] || statusConfig.queued;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

/**
 * Indicador visual de severidade de uma anomalia.
 * 
 * @param severity - Nível de severidade (low, medium, high)
 */
function SeverityIndicator({ severity }: { severity: string }) {
  // Mapeamento de cores por nível de severidade
  const colors: Record<string, string> = {
    low: 'bg-muted',
    medium: 'bg-warning',
    high: 'bg-destructive',
  };

  return (
    <div className={`h-2 w-2 rounded-full mt-2 ${colors[severity] || colors.low}`} />
  );
}
