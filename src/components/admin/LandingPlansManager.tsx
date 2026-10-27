/**
 * @fileoverview Gerenciador de Planos da Landing Page - DrGeFin
 * 
 * Painel administrativo para gerenciar os planos de assinatura
 * exibidos na landing page, incluindo preços, features, destaque
 * e ordenação visual.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um plano da landing page.
 */
interface LandingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  features: string[];
  highlight: boolean;
  highlight_text: string | null;
  is_active: boolean;
  display_order: number;
  cta_text: string;
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  features: string;
  highlight: boolean;
  highlight_text: string;
  is_active: boolean;
  cta_text: string;
}

const emptyFormData: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  price_monthly: '',
  price_yearly: '',
  features: '',
  highlight: false,
  highlight_text: '',
  is_active: true,
  cta_text: 'Começar'
};

export function LandingPlansManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LandingPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(emptyFormData);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-landing-plans'],
    queryFn: async (): Promise<LandingPlan[]> => {
      const { data, error } = await supabase
        .from('landing_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PlanFormData & { id?: string }) => {
      const planData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price_monthly: data.price_monthly ? parseFloat(data.price_monthly) : null,
        price_yearly: data.price_yearly ? parseFloat(data.price_yearly) : null,
        features: data.features.split('\n').filter(f => f.trim()),
        highlight: data.highlight,
        highlight_text: data.highlight_text || null,
        is_active: data.is_active,
        cta_text: data.cta_text || 'Começar',
        display_order: data.id ? undefined : (plans?.length || 0) + 1
      };

      if (data.id) {
        const { error } = await supabase
          .from('landing_plans')
          .update(planData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('landing_plans')
          .insert(planData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['landing-plans'] });
      toast.success(editingPlan ? 'Plano atualizado!' : 'Plano criado!');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Erro ao salvar plano: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['landing-plans'] });
      toast.success('Plano excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir plano: ' + error.message);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('landing_plans')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['landing-plans'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  });

  const moveOrderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const currentIndex = plans?.findIndex(p => p.id === id) ?? -1;
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= (plans?.length || 0)) return;

      const currentPlan = plans![currentIndex];
      const targetPlan = plans![targetIndex];

      await Promise.all([
        supabase.from('landing_plans').update({ display_order: targetPlan.display_order }).eq('id', currentPlan.id),
        supabase.from('landing_plans').update({ display_order: currentPlan.display_order }).eq('id', targetPlan.id)
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['landing-plans'] });
    },
    onError: (error) => {
      toast.error('Erro ao reordenar: ' + error.message);
    }
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: LandingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_monthly: plan.price_monthly?.toString() || '',
      price_yearly: plan.price_yearly?.toString() || '',
      features: plan.features.join('\n'),
      highlight: plan.highlight,
      highlight_text: plan.highlight_text || '',
      is_active: plan.is_active,
      cta_text: plan.cta_text
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingPlan?.id });
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Planos da Landing Page</CardTitle>
          <CardDescription>
            Gerencie os planos exibidos na página de vendas. Ative/desative para controlar quais aparecem.
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Ordem</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead className="text-center">Destaque</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.map((plan, index) => (
                <TableRow key={plan.id} className={cn(!plan.is_active && "opacity-50")}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => moveOrderMutation.mutate({ id: plan.id, direction: 'up' })}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === (plans?.length || 0) - 1}
                        onClick={() => moveOrderMutation.mutate({ id: plan.id, direction: 'down' })}
                      >
                        ↓
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">{plan.slug}</div>
                  </TableCell>
                  <TableCell>{formatPrice(plan.price_monthly)}</TableCell>
                  <TableCell>{formatPrice(plan.price_yearly)}</TableCell>
                  <TableCell className="text-center">
                    {plan.highlight && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        {plan.highlight_text || 'Destaque'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ id: plan.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Excluir este plano?')) {
                            deleteMutation.mutate(plan.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do plano.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Pro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="pro"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Para empresas em crescimento"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: e.target.value }))}
                  placeholder="97.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Preço Anual (R$)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: e.target.value }))}
                  placeholder="970.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="features">Features (uma por linha)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                placeholder="500 mensagens/mês&#10;20 importações/mês&#10;5 usuários"
                rows={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cta_text">Texto do Botão</Label>
              <Input
                id="cta_text"
                value={formData.cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                placeholder="Assinar Pro"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="highlight"
                  checked={formData.highlight}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, highlight: checked }))}
                />
                <Label htmlFor="highlight">Destacar</Label>
              </div>
              
              {formData.highlight && (
                <Input
                  value={formData.highlight_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, highlight_text: e.target.value }))}
                  placeholder="Mais Popular"
                  className="flex-1"
                />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Ativo (visível na landing page)</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPlan ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
