/**
 * @fileoverview Detalhes do Tenant - DrGeFin
 * 
 * Página administrativa que exibe informações detalhadas de um
 * tenant específico: membros, estatísticas de uso, gráficos de
 * atividade e ações administrativas.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TenantAdminActions } from '@/components/admin/TenantAdminActions';
import { 
  ArrowLeft, Building2, Users, FileSpreadsheet, ShoppingCart, 
  MessageSquare, Bot, Calendar, AlertTriangle, Clock 
} from 'lucide-react';
import { format, differenceInDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Dados de um membro do tenant.
 */
interface TenantMember {
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
}

interface UsageHistory {
  date: string;
  imports: number;
  sales: number;
  chats: number;
}

export default function TenantDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: subscription } = useQuery({
    queryKey: ['admin-tenant-subscription', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['admin-tenant-members', id],
    queryFn: async () => {
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('tenant_memberships')
        .select('user_id, role, created_at')
        .eq('tenant_id', id);
      
      if (membershipsError) throw membershipsError;

      // Fetch profiles for each member
      const userIds = membershipsData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profilesMap = profilesData?.reduce((acc, p) => {
        acc[p.id] = { first_name: p.first_name, last_name: p.last_name };
        return acc;
      }, {} as Record<string, { first_name: string; last_name: string }>) || {};

      return membershipsData.map(m => ({
        ...m,
        profile: profilesMap[m.user_id],
      })) as TenantMember[];
    },
    enabled: !!id,
  });

  const { data: usageHistory } = useQuery({
    queryKey: ['admin-tenant-usage-history', id],
    queryFn: async (): Promise<UsageHistory[]> => {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const [
        { data: imports },
        { data: chatUsage },
      ] = await Promise.all([
        supabase.from('import_runs').select('created_at').eq('tenant_id', id),
        supabase.from('chat_usage').select('created_at').eq('tenant_id', id),
      ]);

      const importsByDate = imports?.reduce((acc, r) => {
        const date = format(new Date(r.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const chatsByDate = chatUsage?.reduce((acc, c) => {
        const date = format(new Date(c.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return last30Days.map(date => ({
        date: format(new Date(date), 'dd/MM'),
        imports: importsByDate[date] || 0,
        sales: 0,
        chats: chatsByDate[date] || 0,
      }));
    },
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-tenant-stats', id],
    queryFn: async () => {
      const [
        { count: importCount },
        { count: salesCount },
        { data: chatData },
        { data: lastActivity },
      ] = await Promise.all([
        supabase.from('import_runs').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
        supabase.from('sales_lines').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
        supabase.from('chat_usage').select('total_tokens').eq('tenant_id', id),
        supabase.from('import_runs').select('created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(1),
      ]);

      const totalTokens = chatData?.reduce((acc, c) => acc + (c.total_tokens || 0), 0) || 0;
      const chatSessions = chatData?.length || 0;
      const lastActivityDate = lastActivity?.[0]?.created_at;

      return {
        importCount: importCount || 0,
        salesCount: salesCount || 0,
        chatSessions,
        totalTokens,
        lastActivityDate,
      };
    },
    enabled: !!id,
  });

  const alerts = [];
  
  // Check trial expiring
  if (subscription?.status === 'trialing' && subscription.trial_ends_at) {
    const daysUntilExpiry = differenceInDays(new Date(subscription.trial_ends_at), new Date());
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      alerts.push({
        type: 'warning',
        message: `Trial expira em ${daysUntilExpiry} dia${daysUntilExpiry > 1 ? 's' : ''}`,
        icon: Clock,
      });
    } else if (daysUntilExpiry <= 0) {
      alerts.push({
        type: 'error',
        message: 'Trial expirado',
        icon: AlertTriangle,
      });
    }
  }

  // Check inactivity
  if (stats?.lastActivityDate) {
    const daysSinceActivity = differenceInDays(new Date(), new Date(stats.lastActivityDate));
    if (daysSinceActivity >= 7) {
      alerts.push({
        type: 'warning',
        message: `Inativo há ${daysSinceActivity} dias`,
        icon: Clock,
      });
    }
  } else if (tenant) {
    const daysSinceCreation = differenceInDays(new Date(), new Date(tenant.created_at));
    if (daysSinceCreation >= 3) {
      alerts.push({
        type: 'warning',
        message: 'Nenhuma atividade registrada',
        icon: AlertTriangle,
      });
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">Owner</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Admin</Badge>;
      case 'member':
        return <Badge variant="secondary">Membro</Badge>;
      case 'viewer':
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
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

  if (tenantLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
              {getStatusBadge(subscription?.status)}
            </div>
            <p className="text-muted-foreground">
              Criado em {format(new Date(tenant.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  alert.type === 'error' 
                    ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                    : 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20'
                }`}
              >
                <alert.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Importações</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.importCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.salesCount || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.chatSessions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.totalTokens || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Atividade nos Últimos 30 Dias</CardTitle>
              <CardDescription>Importações e sessões de chat por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval={4}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="imports" fill="hsl(var(--primary))" name="Importações" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="chats" fill="hsl(var(--chart-2))" name="Chats" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Uso</CardTitle>
              <CardDescription>Tendência de atividade acumulada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageHistory?.map((item, idx, arr) => ({
                    ...item,
                    cumImports: arr.slice(0, idx + 1).reduce((acc, i) => acc + i.imports, 0),
                    cumChats: arr.slice(0, idx + 1).reduce((acc, i) => acc + i.chats, 0),
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval={4}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumImports" 
                      stroke="hsl(var(--primary))" 
                      name="Importações (acum.)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumChats" 
                      stroke="hsl(var(--chart-2))" 
                      name="Chats (acum.)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários da Empresa</CardTitle>
            <CardDescription>Lista de membros e suas permissões</CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : members && members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Membro desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        {member.profile 
                          ? `${member.profile.first_name} ${member.profile.last_name}`.trim() || 'Sem nome'
                          : 'Usuário não encontrado'
                        }
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        {format(new Date(member.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Admin Actions */}
        <TenantAdminActions 
          tenantId={id!}
          tenantName={tenant.name}
          subscription={subscription ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            trial_ends_at: subscription.trial_ends_at,
          } : null}
        />

        {/* Subscription Info */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Assinatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium capitalize">{subscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{subscription.status}</p>
                </div>
                {subscription.trial_ends_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trial termina em</p>
                    <p className="font-medium">
                      {format(new Date(subscription.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {subscription.current_period_end && (
                  <div>
                    <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
