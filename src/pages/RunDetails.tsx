/**
 * @fileoverview Página de Detalhes da Importação - DrGeFin
 * 
 * Exibe informações detalhadas sobre uma importação específica:
 * - Status atual (na fila, processando, concluído, erro)
 * - Período dos dados detectados
 * - KPIs resumidos (faturamento, vendas, ticket médio)
 * - Alertas/anomalias detectadas
 * 
 * A página faz polling automático quando o status é "queued" ou "processing"
 * para atualizar o estado em tempo real.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTenant } from '@/hooks/useTenant';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  DollarSign,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de detalhes de uma importação.
 * 
 * Exibe status, metadados, KPIs e anomalias de uma importação específica.
 * Faz polling automático enquanto a importação está em processamento.
 */
export default function RunDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useTenant();

  // Query para buscar dados da importação
  // Faz refetch automático a cada 3s se status for "processing" ou "queued"
  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ['import-run', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from('import_runs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Polling automático enquanto está processando
      if (data?.status === 'processing' || data?.status === 'queued') {
        return 3000; // 3 segundos
      }
      return false; // Para o polling
    },
  });

  // Query para buscar fatos calculados (KPIs) da importação
  const { data: facts } = useQuery({
    queryKey: ['run-facts', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from('run_facts')
        .select('*')
        .eq('import_run_id', id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && run?.status === 'done', // Só busca quando processamento concluído
  });

  // Query para buscar anomalias detectadas
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies', id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from('anomalies')
        .select('*')
        .eq('import_run_id', id)
        .order('severity', { ascending: false }); // Mais graves primeiro
      return data || [];
    },
    enabled: !!id && run?.status === 'done',
  });

  // Configuração de ícones e cores para cada status
  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    queued: { label: 'Na fila', icon: Clock, color: 'bg-muted text-muted-foreground' },
    processing: { label: 'Processando', icon: Loader2, color: 'bg-primary/10 text-primary' },
    done: { label: 'Concluído', icon: CheckCircle, color: 'bg-success/10 text-success' },
    failed: { label: 'Erro', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
    canceled: { label: 'Cancelado', icon: XCircle, color: 'bg-muted text-muted-foreground' },
  };

  // Configuração de labels e cores para severidade de anomalias
  const severityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
    medium: { label: 'Média', color: 'bg-warning/10 text-warning' },
    high: { label: 'Alta', color: 'bg-destructive/10 text-destructive' },
  };

  // Estado de carregamento
  if (runLoading) {
    return (
      <AppLayout title="Detalhes da Importação">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Importação não encontrada
  if (!run) {
    return (
      <AppLayout title="Importação não encontrada">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <XCircle className="h-12 w-12 mb-4 opacity-50" />
          <p>Importação não encontrada</p>
          <Button className="mt-4" onClick={() => navigate('/app/imports')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    );
  }

  const config = statusConfig[run.status] || statusConfig.queued;
  const StatusIcon = config.icon;
  
  // Extrai dados dos fatos (KPIs calculados)
  const factsData = facts?.facts as Record<string, unknown> | null;

  return (
    <AppLayout title="Detalhes da Importação">
      <div className="space-y-6 animate-fade-in">
        {/* Barra de navegação */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/app/imports')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          {/* Botão para ir ao chat - só aparece quando processamento concluído */}
          {run.status === 'done' && (
            <Button onClick={() => navigate('/app/chat')} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversar sobre dados
            </Button>
          )}
        </div>

        {/* Card principal com informações da importação */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Ícone do arquivo */}
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              
              {/* Informações do arquivo */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">
                  {run.original_filename || 'Arquivo sem nome'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {/* Data de criação */}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(run.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {/* Período detectado nos dados */}
                  {run.detected_start_date && run.detected_end_date && (
                    <span>
                      Período: {new Date(run.detected_start_date).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(run.detected_end_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Badge de status */}
              <Badge className={`${config.color} gap-1`}>
                <StatusIcon className={`h-3 w-3 ${run.status === 'processing' ? 'animate-spin' : ''}`} />
                {config.label}
              </Badge>
            </div>

            {/* Mensagem de erro (se falhou) */}
            {run.status === 'failed' && run.error_message && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">Erro no processamento:</p>
                <p className="text-sm text-destructive/80 mt-1">{run.error_message}</p>
              </div>
            )}

            {/* Mensagem de processamento (se em andamento) */}
            {(run.status === 'queued' || run.status === 'processing') && (
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-primary font-medium flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {run.status === 'queued' 
                    ? 'Aguardando processamento...'
                    : 'Processando seus dados...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards de KPIs - só exibe quando processamento concluído */}
        {run.status === 'done' && factsData && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* KPI: Faturamento Total */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Faturamento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {((factsData.total_revenue as number) || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </CardContent>
            </Card>

            {/* KPI: Total de Vendas */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Total de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {((factsData.total_sales as number) || 0).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            {/* KPI: Ticket Médio */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {((factsData.avg_ticket as number) || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Card de anomalias detectadas - só exibe quando há anomalias */}
        {run.status === 'done' && anomalies && anomalies.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas Detectados ({anomalies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anomalies.map((anomaly) => {
                  const severity = severityConfig[anomaly.severity] || severityConfig.low;
                  return (
                    <div
                      key={anomaly.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
                    >
                      {/* Badge de severidade */}
                      <Badge className={severity.color}>{severity.label}</Badge>
                      <div className="flex-1">
                        <p className="font-medium">{anomaly.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Código: {anomaly.code}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
