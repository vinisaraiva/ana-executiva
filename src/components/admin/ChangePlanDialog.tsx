import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  currentStatus: string;
  onConfirm: (newPlan: string, newStatus: string) => void;
  isLoading?: boolean;
}

const PLANS = [
  { value: 'trial', label: 'Trial', description: 'Período de teste gratuito' },
  { value: 'basic', label: 'Basic', description: 'Plano básico para pequenas empresas' },
  { value: 'pro', label: 'Pro', description: 'Plano profissional com recursos avançados' },
  { value: 'enterprise', label: 'Enterprise', description: 'Plano empresarial completo' },
];

const STATUSES = [
  { value: 'trialing', label: 'Em Trial' },
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'canceled', label: 'Cancelado' },
];

export function ChangePlanDialog({
  open,
  onOpenChange,
  currentPlan,
  currentStatus,
  onConfirm,
  isLoading,
}: ChangePlanDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
    // Ajustar status automaticamente
    if (plan === 'trial') {
      setSelectedStatus('trialing');
    } else if (selectedStatus === 'trialing') {
      setSelectedStatus('active');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Alterar Plano
          </DialogTitle>
          <DialogDescription>
            Plano atual: <strong>{currentPlan}</strong> | Status:{' '}
            <strong>{currentStatus}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Novo Plano</Label>
            <Select value={selectedPlan} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{plan.label}</span>
                      <span className="text-xs text-muted-foreground">{plan.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Novo Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedPlan !== currentPlan || selectedStatus !== currentStatus) && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Alterações:</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {selectedPlan !== currentPlan && (
                  <li>
                    Plano: {currentPlan} → <strong>{selectedPlan}</strong>
                  </li>
                )}
                {selectedStatus !== currentStatus && (
                  <li>
                    Status: {currentStatus} → <strong>{selectedStatus}</strong>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(selectedPlan, selectedStatus)}
            disabled={isLoading || (selectedPlan === currentPlan && selectedStatus === currentStatus)}
          >
            {isLoading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
