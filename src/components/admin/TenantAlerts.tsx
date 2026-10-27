/**
 * @fileoverview Alertas de Tenants - DrGeFin
 * 
 * Componente administrativo que exibe alertas sobre tenants
 * que precisam de atenção: trials expirando, trials expirados
 * e tenants inativos há muito tempo.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Building2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um alerta de tenant.
 */
interface TenantAlert {
  tenantId: string;
  tenantName: string;
  type: 'trial_expiring' | 'trial_expired' | 'inactive';
  severity: 'warning' | 'error';
  message: string;
  daysUntil?: number;
  daysSince?: number;
}

export function TenantAlerts() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['admin-tenant-alerts'],
    queryFn: async (): Promise<TenantAlert[]> => {
      const [
        { data: tenants },
        { data: subscriptions },
        { data: lastImports },
      ] = await Promise.all([
        supabase.from('tenants').select('id, name, created_at'),
        supabase.from('tenant_subscriptions').select('*'),
        supabase.from('import_runs')
          .select('tenant_id, created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (!tenants) return [];

      const subscriptionMap = subscriptions?.reduce((acc, s) => {
        acc[s.tenant_id] = s;
        return acc;
      }, {} as Record<string, typeof subscriptions[0]>) || {};

      // Get last activity per tenant
      const lastActivityMap: Record<string, string> = {};
      lastImports?.forEach(imp => {
        if (!lastActivityMap[imp.tenant_id]) {
          lastActivityMap[imp.tenant_id] = imp.created_at;
        }
      });

      const alertsList: TenantAlert[] = [];

      tenants.forEach(tenant => {
        const sub = subscriptionMap[tenant.id];
        
        // Check trial expiring/expired
        if (sub?.status === 'trialing' && sub.trial_ends_at) {
          const daysUntil = differenceInDays(new Date(sub.trial_ends_at), new Date());
          
          if (daysUntil <= 0) {
            alertsList.push({
              tenantId: tenant.id,
              tenantName: tenant.name,
              type: 'trial_expired',
              severity: 'error',
              message: 'Trial expirado',
              daysUntil: Math.abs(daysUntil),
            });
          } else if (daysUntil <= 7) {
            alertsList.push({
              tenantId: tenant.id,
              tenantName: tenant.name,
              type: 'trial_expiring',
              severity: 'warning',
              message: `Trial expira em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`,
              daysUntil,
            });
          }
        }

        // Check inactivity (7+ days without activity)
        const lastActivity = lastActivityMap[tenant.id];
        const referenceDate = lastActivity || tenant.created_at;
        const daysSinceActivity = differenceInDays(new Date(), new Date(referenceDate));

        if (daysSinceActivity >= 7) {
          alertsList.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            type: 'inactive',
            severity: daysSinceActivity >= 14 ? 'error' : 'warning',
            message: lastActivity 
              ? `Inativo há ${daysSinceActivity} dias`
              : 'Nenhuma atividade desde a criação',
            daysSince: daysSinceActivity,
          });
        }
      });

      // Sort by severity (errors first) then by urgency
      return alertsList.sort((a, b) => {
        if (a.severity !== b.severity) {
          return a.severity === 'error' ? -1 : 1;
        }
        return (a.daysUntil || a.daysSince || 0) - (b.daysUntil || b.daysSince || 0);
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas
          </CardTitle>
          <CardDescription>Empresas que precisam de atenção</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum alerta no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: TenantAlert['type']) => {
    switch (type) {
      case 'trial_expiring':
      case 'trial_expired':
        return Clock;
      case 'inactive':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const getAlertBadge = (alert: TenantAlert) => {
    if (alert.severity === 'error') {
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Crítico</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Atenção</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas ({alerts.length})
        </CardTitle>
        <CardDescription>Empresas que precisam de atenção</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 10).map((alert, idx) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <Link 
                key={`${alert.tenantId}-${alert.type}-${idx}`}
                to={`/admin/tenant/${alert.tenantId}`}
                className="block"
              >
                <div 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                    alert.severity === 'error' 
                      ? 'border-destructive/30 bg-destructive/5' 
                      : 'border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${
                    alert.severity === 'error' ? 'text-destructive' : 'text-yellow-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-sm truncate">{alert.tenantName}</span>
                    </div>
                    <p className={`text-xs ${
                      alert.severity === 'error' ? 'text-destructive' : 'text-yellow-700'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                  {getAlertBadge(alert)}
                </div>
              </Link>
            );
          })}
          {alerts.length > 10 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              + {alerts.length - 10} alertas adicionais
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
