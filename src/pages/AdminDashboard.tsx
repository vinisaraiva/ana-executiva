/**
 * @fileoverview Dashboard Administrativo da Plataforma - DrGeFin
 * 
 * Painel central de administração da plataforma, exibindo métricas
 * globais, lista de empresas cadastradas, alertas, logs de auditoria
 * e configurações da landing page e IA.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { SectorsManager } from '@/components/admin/SectorsManager';
import { AIPromptSettings } from '@/components/admin/AIPromptSettings';
import { WhatsAppAudioSettings } from '@/components/admin/WhatsAppAudioSettings';
import { TenantAlerts } from '@/components/admin/TenantAlerts';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';
import { PlanLimitsManager } from '@/components/admin/PlanLimitsManager';
import { LandingPlansManager } from '@/components/admin/LandingPlansManager';
import { LandingSettingsManager } from '@/components/admin/LandingSettingsManager';
import { CalculatorSettingsManager } from '@/components/admin/CalculatorSettingsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, CreditCard, AlertCircle, Settings2, Bot, FileSpreadsheet, ShoppingCart, MessageSquare, ExternalLink, ChevronUp, ChevronDown, ArrowUpDown, Shield, Gauge, Layout } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Dados de um tenant com informações de subscription e métricas.
 */
interface TenantWithSubscription {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  subscription?: {
    plan: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  };
  member_count: number;
  import_count: number;
  sales_count: number;
  chat_sessions: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}

type SortColumn = 'name' | 'member_count' | 'import_count' | 'sales_count' | 'chat_sessions' | 'total_tokens' | 'created_at';
type SortDirection = 'asc' | 'desc';

// Preços GPT-4o-mini (por 1M tokens)
const INPUT_COST_PER_MILLION = 0.15;  // $0.15/1M
const OUTPUT_COST_PER_MILLION = 0.60; // $0.60/1M

const calculateTokenCost = (promptTokens: number, completionTokens: number): number => {
  const inputCost = (promptTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return inputCost + outputCost;
};

export default function AdminDashboard() {
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async (): Promise<TenantWithSubscription[]> => {
      const [
        { data: tenantsData, error: tenantsError },
        { data: subscriptions },
        { data: memberships },
        { data: importRuns },
        { data: salesCountsData },
        { data: chatUsage },
      ] = await Promise.all([
        supabase.from('tenants').select('*').order('created_at', { ascending: false }),
        supabase.from('tenant_subscriptions').select('*'),
        supabase.from('tenant_memberships').select('tenant_id'),
        supabase.from('import_runs').select('tenant_id'),
        supabase.rpc('get_sales_counts_by_tenant'),
        supabase.from('chat_usage').select('tenant_id, prompt_tokens, completion_tokens, total_tokens'),
      ]);

      if (tenantsError) throw tenantsError;

      const memberCounts = memberships?.reduce((acc, m) => {
        acc[m.tenant_id] = (acc[m.tenant_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const importCounts = importRuns?.reduce((acc, r) => {
        acc[r.tenant_id] = (acc[r.tenant_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const salesCounts = salesCountsData?.reduce((acc, row) => {
        acc[row.tenant_id] = Number(row.count);
        return acc;
      }, {} as Record<string, number>) || {};

      const chatStats = chatUsage?.reduce((acc, c) => {
        if (!acc[c.tenant_id]) acc[c.tenant_id] = { sessions: 0, tokens: 0, promptTokens: 0, completionTokens: 0 };
        acc[c.tenant_id].sessions += 1;
        acc[c.tenant_id].tokens += c.total_tokens || 0;
        acc[c.tenant_id].promptTokens += c.prompt_tokens || 0;
        acc[c.tenant_id].completionTokens += c.completion_tokens || 0;
        return acc;
      }, {} as Record<string, { sessions: number; tokens: number; promptTokens: number; completionTokens: number }>) || {};

      return tenantsData.map(tenant => ({
        ...tenant,
        subscription: subscriptions?.find(s => s.tenant_id === tenant.id),
        member_count: memberCounts[tenant.id] || 0,
        import_count: importCounts[tenant.id] || 0,
        sales_count: salesCounts[tenant.id] || 0,
        chat_sessions: chatStats[tenant.id]?.sessions || 0,
        total_tokens: chatStats[tenant.id]?.tokens || 0,
        prompt_tokens: chatStats[tenant.id]?.promptTokens || 0,
        completion_tokens: chatStats[tenant.id]?.completionTokens || 0,
      }));
    },
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedTenants = useMemo(() => {
    if (!tenants) return [];

    return [...tenants].sort((a, b) => {
      let valueA: string | number | Date;
      let valueB: string | number | Date;

      switch (sortColumn) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'member_count':
          valueA = a.member_count;
          valueB = b.member_count;
          break;
        case 'import_count':
          valueA = a.import_count;
          valueB = b.import_count;
          break;
        case 'sales_count':
          valueA = a.sales_count;
          valueB = b.sales_count;
          break;
        case 'chat_sessions':
          valueA = a.chat_sessions;
          valueB = b.chat_sessions;
          break;
        case 'total_tokens':
          valueA = a.total_tokens;
          valueB = b.total_tokens;
          break;
        case 'created_at':
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        default:
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return sortDirection === 'asc'
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });
  }, [tenants, sortColumn, sortDirection]);

  const stats = useMemo(() => {
    const totalPromptTokens = tenants?.reduce((acc, t) => acc + t.prompt_tokens, 0) || 0;
    const totalCompletionTokens = tenants?.reduce((acc, t) => acc + t.completion_tokens, 0) || 0;
    const totalCost = calculateTokenCost(totalPromptTokens, totalCompletionTokens);

    return {
      totalTenants: tenants?.length || 0,
      activeTenants: tenants?.filter(t => t.subscription?.status === 'active').length || 0,
      trialTenants: tenants?.filter(t => !t.subscription || t.subscription?.status === 'trialing').length || 0,
      totalUsers: tenants?.reduce((acc, t) => acc + t.member_count, 0) || 0,
      totalImports: tenants?.reduce((acc, t) => acc + t.import_count, 0) || 0,
      totalSales: tenants?.reduce((acc, t) => acc + t.sales_count, 0) || 0,
      totalChatSessions: tenants?.reduce((acc, t) => acc + t.chat_sessions, 0) || 0,
      totalTokens: tenants?.reduce((acc, t) => acc + t.total_tokens, 0) || 0,
      totalPromptTokens,
      totalCompletionTokens,
      totalCost,
    };
  }, [tenants]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Ativo</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Pendente</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Sem assinatura</Badge>;
    }
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pro</Badge>;
      case 'basic':
        return <Badge variant="secondary">Basic</Badge>;
      default:
        return <Badge variant="outline">Trial</Badge>;
    }
  };

  const SortableHeader = ({ column, label, className }: { column: SortColumn; label: string; className?: string }) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50 select-none transition-colors", className)}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortColumn === column ? (
          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administração da Plataforma</h1>
          <p className="text-muted-foreground">Gerencie todos os clientes e configurações</p>
        </div>

        <Tabs defaultValue="empresas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="empresas" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="ia" className="gap-2">
              <Bot className="h-4 w-4" />
              Chat IA
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-2">
              <Shield className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="limites" className="gap-2">
              <Gauge className="h-4 w-4" />
              Limites
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="landing" className="gap-2">
              <Layout className="h-4 w-4" />
              Landing Page
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresas" className="space-y-6">
            {/* Alerts */}
            <TenantAlerts />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Empresas</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTenants}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeTenants}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trial</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.trialTenants}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Importações</CardTitle>
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalImports}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalSales)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chats</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalChatSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tokens</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalTokens)}</div>
                  <p className="text-xs text-muted-foreground">
                    ~${stats.totalCost.toFixed(2)} USD
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tenants Table */}
            <Card>
              <CardHeader>
                <CardTitle>Empresas Cadastradas</CardTitle>
                <CardDescription>Lista de todas as empresas na plataforma. Clique nos cabeçalhos para ordenar.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader column="name" label="Empresa" />
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <SortableHeader column="member_count" label="Usuários" className="text-center" />
                        <SortableHeader column="import_count" label="Imports" className="text-center" />
                        <SortableHeader column="sales_count" label="Vendas" className="text-center" />
                        <SortableHeader column="chat_sessions" label="Chats" className="text-center" />
                        <SortableHeader column="total_tokens" label="Tokens" className="text-center" />
                        <SortableHeader column="created_at" label="Criado em" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTenants.map((tenant) => (
                        <TableRow key={tenant.id} className="group">
                          <TableCell className="font-medium">
                            <Link
                              to={`/admin/tenant/${tenant.id}`}
                              className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                              {tenant.name}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </TableCell>
                          <TableCell>{getPlanBadge(tenant.subscription?.plan)}</TableCell>
                          <TableCell>{getStatusBadge(tenant.subscription?.status)}</TableCell>
                          <TableCell className="text-center">{tenant.member_count}</TableCell>
                          <TableCell className="text-center">{tenant.import_count}</TableCell>
                          <TableCell className="text-center">{formatNumber(tenant.sales_count)}</TableCell>
                          <TableCell className="text-center">{tenant.chat_sessions}</TableCell>
                          <TableCell className="text-center">{formatNumber(tenant.total_tokens)}</TableCell>
                          <TableCell>
                            {format(new Date(tenant.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ia" className="space-y-6">
            <AIPromptSettings />
          </TabsContent>

          <TabsContent value="auditoria" className="space-y-6">
            <AuditLogsViewer />
          </TabsContent>

          <TabsContent value="limites" className="space-y-6">
            <PlanLimitsManager />
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-6">
            <SectorsManager />
          </TabsContent>

          <TabsContent value="landing" className="space-y-6">
            <LandingPlansManager />
            <LandingSettingsManager />
            <CalculatorSettingsManager />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <WhatsAppAudioSettings />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comandos WhatsApp
                </CardTitle>
                <CardDescription>
                  Gerencie os comandos globais disponíveis para todos os usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  to="/app/settings/whatsapp-commands"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Gerenciar Comandos Globais
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
