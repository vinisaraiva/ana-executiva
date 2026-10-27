import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Save, Infinity, MessageSquare, FileUp, Users, Clock, Phone } from 'lucide-react';

interface PlanLimit {
  id: string;
  plan_name: string;
  max_messages_per_month: number | null;
  max_imports_per_month: number | null;
  max_users: number | null;
  trial_days: number | null;
  max_whatsapp_numbers: number | null;
}

const planLabels: Record<string, { label: string; color: string }> = {
  trial: { label: 'Trial', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
  basic: { label: 'Basic', color: 'bg-gray-500/20 text-gray-700 border-gray-500/30' },
  pro: { label: 'Pro', color: 'bg-primary/20 text-primary border-primary/30' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-500/20 text-purple-700 border-purple-500/30' },
};

export function PlanLimitsManager() {
  const queryClient = useQueryClient();
  const [editedLimits, setEditedLimits] = useState<Record<string, Partial<PlanLimit>>>({});

  const { data: limits, isLoading } = useQuery({
    queryKey: ['plan-limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .order('plan_name');

      if (error) throw error;
      return data as PlanLimit[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlanLimit> }) => {
      const { error } = await supabase
        .from('plan_limits')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-limits'] });
      setEditedLimits({});
      toast({
        title: 'Limites atualizados',
        description: 'As configurações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const handleChange = (planId: string, field: keyof PlanLimit, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    setEditedLimits(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: isNaN(numValue as number) ? null : numValue,
      },
    }));
  };

  const handleSave = (plan: PlanLimit) => {
    const updates = editedLimits[plan.id];
    if (!updates || Object.keys(updates).length === 0) return;

    updateMutation.mutate({ id: plan.id, updates });
  };

  const getValue = (plan: PlanLimit, field: keyof PlanLimit): string => {
    const edited = editedLimits[plan.id]?.[field];
    if (edited !== undefined) {
      return edited === null ? '' : String(edited);
    }
    const original = plan[field];
    return original === null ? '' : String(original);
  };

  const hasChanges = (planId: string) => {
    return editedLimits[planId] && Object.keys(editedLimits[planId]).length > 0;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Limites por Plano</h2>
        <p className="text-sm text-muted-foreground">
          Configure os limites mensais de uso para cada plano. Deixe em branco para ilimitado.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {limits?.map(plan => (
          <Card key={plan.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge className={planLabels[plan.plan_name]?.color}>
                  {planLabels[plan.plan_name]?.label || plan.plan_name}
                </Badge>
                {hasChanges(plan.id) && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(plan)}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Mensagens/mês
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ilimitado"
                    value={getValue(plan, 'max_messages_per_month')}
                    onChange={(e) => handleChange(plan.id, 'max_messages_per_month', e.target.value)}
                  />
                  {getValue(plan, 'max_messages_per_month') === '' && (
                    <Infinity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  Importações/mês
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ilimitado"
                    value={getValue(plan, 'max_imports_per_month')}
                    onChange={(e) => handleChange(plan.id, 'max_imports_per_month', e.target.value)}
                  />
                  {getValue(plan, 'max_imports_per_month') === '' && (
                    <Infinity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Usuários máx.
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ilimitado"
                    value={getValue(plan, 'max_users')}
                    onChange={(e) => handleChange(plan.id, 'max_users', e.target.value)}
                  />
                  {getValue(plan, 'max_users') === '' && (
                    <Infinity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Números WhatsApp
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={getValue(plan, 'max_whatsapp_numbers')}
                    onChange={(e) => handleChange(plan.id, 'max_whatsapp_numbers', e.target.value)}
                  />
                  {getValue(plan, 'max_whatsapp_numbers') === '' && (
                    <Infinity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {plan.plan_name === 'trial' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Dias de trial
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={getValue(plan, 'trial_days')}
                    onChange={(e) => handleChange(plan.id, 'trial_days', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
