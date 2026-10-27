/**
 * @fileoverview Card de Uso do Plano - DrGeFin
 * 
 * Componente que exibe informações do plano atual do tenant,
 * incluindo status da assinatura, dias restantes de trial
 * e barras de progresso de uso (mensagens e importações).
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, FileUp, Calendar, Crown, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Resultado da verificação de limites do plano.
 */
interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  reason?: string;
  message?: string;
}

interface Subscription {
  plan: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

export function PlanUsageCard() {
  const { tenant } = useTenant();

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select('plan, status, trial_ends_at, current_period_start, current_period_end')
        .eq('tenant_id', tenant!.id)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!tenant?.id,
  });

  const { data: messagesUsage, isLoading: loadingMessages } = useQuery({
    queryKey: ['usage-meter', tenant?.id, 'messages'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_tenant_limits', {
        _tenant_id: tenant!.id,
        _limit_type: 'messages',
      });
      if (error) throw error;
      return data as unknown as LimitCheckResult;
    },
    enabled: !!tenant?.id,
  });

  const { data: importsUsage, isLoading: loadingImports } = useQuery({
    queryKey: ['usage-meter', tenant?.id, 'imports'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_tenant_limits', {
        _tenant_id: tenant!.id,
        _limit_type: 'imports',
      });
      if (error) throw error;
      return data as unknown as LimitCheckResult;
    },
    enabled: !!tenant?.id,
  });

  const isLoading = loadingSubscription || loadingMessages || loadingImports;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const planDisplayName = subscription?.plan === 'trial' ? 'Trial' : 
    subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || 'N/A';

  const statusBadge = () => {
    switch (subscription?.status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Ativo</Badge>;
      case 'trialing':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Em Trial</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Pagamento Pendente</Badge>;
      default:
        return <Badge variant="secondary">{subscription?.status}</Badge>;
    }
  };

  const trialDaysRemaining = subscription?.trial_ends_at 
    ? differenceInDays(new Date(subscription.trial_ends_at), new Date())
    : null;

  const renderUsageBar = (
    usage: LimitCheckResult | undefined, 
    icon: React.ReactNode, 
    label: string
  ) => {
    if (!usage) return null;
    
    const isUnlimited = usage.limit === null;
    const percentage = isUnlimited ? 0 : Math.min((usage.current / usage.limit!) * 100, 100);
    const isCritical = percentage >= 80;
    const isBlocked = percentage >= 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            {icon}
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {isBlocked && (
              <Badge variant="destructive" className="text-xs">Limite atingido</Badge>
            )}
            <span className={cn(
              'text-sm font-semibold',
              isBlocked ? 'text-destructive' : isCritical ? 'text-amber-500' : 'text-foreground'
            )}>
              {isUnlimited ? (
                <span className="text-muted-foreground">{usage.current} usados • Ilimitado</span>
              ) : (
                `${usage.current} / ${usage.limit}`
              )}
            </span>
          </div>
        </div>
        {!isUnlimited && (
          <Progress
            value={percentage}
            className={cn(
              'h-2',
              isBlocked ? '[&>div]:bg-destructive' : 
              isCritical ? '[&>div]:bg-amber-500' : ''
            )}
          />
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Plano {planDisplayName}</CardTitle>
              <CardDescription>
                Uso do período atual
              </CardDescription>
            </div>
          </div>
          {statusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trial warning */}
        {subscription?.status === 'trialing' && trialDaysRemaining !== null && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-lg',
            trialDaysRemaining <= 3 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'
          )}>
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">
              {trialDaysRemaining <= 0 
                ? 'Seu trial expirou' 
                : `${trialDaysRemaining} dias restantes no trial`}
            </span>
          </div>
        )}

        {/* Period info */}
        {subscription?.current_period_start && subscription?.current_period_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Período: {format(new Date(subscription.current_period_start), "dd 'de' MMM", { locale: ptBR })} 
              {' '}-{' '}
              {format(new Date(subscription.current_period_end), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Usage meters */}
        <div className="space-y-4">
          {renderUsageBar(
            messagesUsage,
            <MessageSquare className="h-4 w-4 text-muted-foreground" />,
            'Mensagens de Chat'
          )}
          {renderUsageBar(
            importsUsage,
            <FileUp className="h-4 w-4 text-muted-foreground" />,
            'Importações'
          )}
        </div>
      </CardContent>
    </Card>
  );
}
