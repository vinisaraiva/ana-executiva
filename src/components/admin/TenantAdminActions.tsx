/**
 * @fileoverview Ações Administrativas de Tenant - DrGeFin
 * 
 * Componente que agrupa as ações administrativas disponíveis
 * para gerenciar um tenant específico: estender trial, pausar,
 * ativar, alterar plano e enviar notificações.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarPlus,
  Pause,
  Play,
  CreditCard,
  Mail,
  History,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExtendTrialDialog } from './ExtendTrialDialog';
import { ChangePlanDialog } from './ChangePlanDialog';
import { SendNotificationDialog } from './SendNotificationDialog';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props do componente TenantAdminActions.
 */
interface TenantAdminActionsProps {
  tenantId: string;
  tenantName: string;
  subscription: {
    id: string;
    plan: string;
    status: string;
    trial_ends_at: string | null;
  } | null;
}

interface ActionLog {
  id: string;
  action_type: string;
  details: Record<string, unknown>;
  created_at: string;
  admin_user_id: string;
}

export function TenantAdminActions({
  tenantId,
  tenantName,
  subscription,
}: TenantAdminActionsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showExtendTrial, setShowExtendTrial] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showSendNotification, setShowSendNotification] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);

  // Buscar histórico de ações
  const { data: actionLogs } = useQuery({
    queryKey: ['admin-actions', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_actions_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as ActionLog[];
    },
  });

  // Registrar ação no log
  const logAction = async (actionType: string, details: Record<string, unknown>) => {
    if (!user) return;
    
    await supabase.from('admin_actions_log').insert([{
      tenant_id: tenantId,
      admin_user_id: user.id,
      action_type: actionType,
      details: details as unknown as import('@/integrations/supabase/types').Json,
    }]);
  };

  // Mutation para atualizar subscription
  const updateSubscription = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!subscription) throw new Error('Subscription não encontrada');
      
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update(updates)
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['subscription', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin-actions', tenantId] });
    },
  });

  // Estender trial
  const handleExtendTrial = async (newEndDate: Date) => {
    try {
      await updateSubscription.mutateAsync({
        trial_ends_at: newEndDate.toISOString(),
        status: 'trialing',
      });
      await logAction('extend_trial', {
        new_end_date: newEndDate.toISOString(),
        previous_end_date: subscription?.trial_ends_at,
      });
      toast.success('Trial estendido com sucesso');
      setShowExtendTrial(false);
    } catch (error) {
      toast.error('Erro ao estender trial');
    }
  };

  // Pausar trial
  const handlePauseTrial = async () => {
    try {
      await updateSubscription.mutateAsync({ status: 'paused' });
      await logAction('pause_trial', { previous_status: subscription?.status });
      toast.success('Trial pausado');
      setShowPauseConfirm(false);
    } catch (error) {
      toast.error('Erro ao pausar trial');
    }
  };

  // Ativar conta
  const handleActivate = async () => {
    try {
      await updateSubscription.mutateAsync({ status: 'active' });
      await logAction('activate', { previous_status: subscription?.status });
      toast.success('Conta ativada');
      setShowActivateConfirm(false);
    } catch (error) {
      toast.error('Erro ao ativar conta');
    }
  };

  // Mudar plano
  const handleChangePlan = async (newPlan: string, newStatus: string) => {
    try {
      await updateSubscription.mutateAsync({ plan: newPlan, status: newStatus });
      await logAction('change_plan', {
        previous_plan: subscription?.plan,
        new_plan: newPlan,
        previous_status: subscription?.status,
        new_status: newStatus,
      });
      toast.success('Plano alterado com sucesso');
      setShowChangePlan(false);
    } catch (error) {
      toast.error('Erro ao alterar plano');
    }
  };

  // Enviar notificação
  const handleSendNotification = async (subject: string, message: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-admin-notification', {
        body: { tenant_id: tenantId, subject, message },
      });

      if (error) throw error;

      await logAction('send_notification', { subject });
      toast.success('Notificação enviada com sucesso');
      setShowSendNotification(false);
    } catch (error) {
      toast.error('Erro ao enviar notificação. Verifique se a chave RESEND_API_KEY está configurada.');
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      extend_trial: 'Trial estendido',
      pause_trial: 'Trial pausado',
      activate: 'Conta ativada',
      change_plan: 'Plano alterado',
      send_notification: 'Notificação enviada',
    };
    return labels[actionType] || actionType;
  };

  const isPaused = subscription?.status === 'paused';
  const isTrialing = subscription?.status === 'trialing';

  // Criar subscription manualmente
  const createSubscription = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id: tenantId,
          plan: 'trial',
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['subscription', tenantId] });
      toast.success('Subscription criada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar subscription');
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Administrativas</CardTitle>
          <CardDescription>Gerencie a conta desta empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!subscription && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Subscription não encontrada</p>
                <p className="text-xs opacity-80">Este tenant não possui subscription configurada.</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => createSubscription.mutate()}
                disabled={createSubscription.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Criar
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExtendTrial(true)}
              disabled={!subscription}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Estender Trial
            </Button>

            {isPaused ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivateConfirm(true)}
              >
                <Play className="h-4 w-4 mr-2" />
                Ativar Conta
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPauseConfirm(true)}
                disabled={!subscription}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar Trial
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePlan(true)}
              disabled={!subscription}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Alterar Plano
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSendNotification(true)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar Notificação
            </Button>
          </div>

          {actionLogs && actionLogs.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <History className="h-4 w-4" />
                Histórico de Ações
              </h4>
              <ul className="space-y-2">
                {actionLogs.map((log) => (
                  <li key={log.id} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{getActionLabel(log.action_type)}</span>
                    <span>•</span>
                    <span>{format(new Date(log.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ExtendTrialDialog
        open={showExtendTrial}
        onOpenChange={setShowExtendTrial}
        currentEndDate={subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null}
        onConfirm={handleExtendTrial}
        isLoading={updateSubscription.isPending}
      />

      <ChangePlanDialog
        open={showChangePlan}
        onOpenChange={setShowChangePlan}
        currentPlan={subscription?.plan || 'trial'}
        currentStatus={subscription?.status || 'trialing'}
        onConfirm={handleChangePlan}
        isLoading={updateSubscription.isPending}
      />

      <SendNotificationDialog
        open={showSendNotification}
        onOpenChange={setShowSendNotification}
        tenantName={tenantName}
        onConfirm={handleSendNotification}
      />

      {/* Confirm Pause */}
      <AlertDialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pausar Trial</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja pausar o trial de <strong>{tenantName}</strong>? A empresa não
              terá acesso às funcionalidades enquanto estiver pausada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePauseTrial}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Activate */}
      <AlertDialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja ativar a conta de <strong>{tenantName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
