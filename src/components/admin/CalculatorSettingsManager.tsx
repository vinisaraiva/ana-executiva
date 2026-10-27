/**
 * @fileoverview Gerenciador de Configurações da Calculadora - DrGeFin
 * 
 * Painel administrativo para configurar os valores da calculadora
 * de economia exibida na landing page, incluindo custo/hora de
 * serviços de consultoria e preço da plataforma.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2, Calculator, DollarSign } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Configuração de um serviço de consultoria para comparação.
 */
interface ServiceConfig {
  id: string;
  name: string;
  hourlyRate: number;
  maxHours: number;
  defaultHours: number;
  description: string;
}

interface CalculatorSettings {
  platformMonthlyCost: number;
  services: ServiceConfig[];
}

const defaultSettings: CalculatorSettings = {
  platformMonthlyCost: 297,
  services: [
    {
      id: 'financial',
      name: 'Análise Financeira',
      hourlyRate: 300,
      maxHours: 20,
      defaultHours: 4,
      description: 'Fluxo de caixa, DRE, balanços'
    },
    {
      id: 'pricing',
      name: 'Consultoria de Preços',
      hourlyRate: 250,
      maxHours: 15,
      defaultHours: 2,
      description: 'Precificação e margens'
    },
    {
      id: 'reports',
      name: 'Relatórios Gerenciais',
      hourlyRate: 200,
      maxHours: 15,
      defaultHours: 3,
      description: 'Dashboards e KPIs'
    },
    {
      id: 'dataAnalysis',
      name: 'Análise de Dados',
      hourlyRate: 220,
      maxHours: 10,
      defaultHours: 2,
      description: 'Insights e tendências'
    }
  ]
};

export function CalculatorSettingsManager() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<CalculatorSettings>(defaultSettings);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-calculator-settings'],
    queryFn: async (): Promise<CalculatorSettings> => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'calculator_settings')
        .maybeSingle();

      if (error) throw error;
      if (!data?.value) return defaultSettings;
      const val = data.value as unknown as CalculatorSettings;
      return {
        platformMonthlyCost: val.platformMonthlyCost ?? defaultSettings.platformMonthlyCost,
        services: val.services ?? defaultSettings.services
      };
    }
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: CalculatorSettings) => {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'calculator_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: newSettings as unknown as Json })
          .eq('key', 'calculator_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert([{ key: 'calculator_settings', value: newSettings as unknown as Json }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-calculator-settings'] });
      queryClient.invalidateQueries({ queryKey: ['calculator-settings'] });
      toast.success('Configurações da calculadora salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateService = (index: number, field: keyof ServiceConfig, value: string | number) => {
    const newServices = [...settings.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setSettings({ ...settings, services: newServices });
  };

  const addService = () => {
    const newId = `service_${Date.now()}`;
    setSettings({
      ...settings,
      services: [...settings.services, {
        id: newId,
        name: 'Novo Serviço',
        hourlyRate: 200,
        maxHours: 10,
        defaultHours: 2,
        description: 'Descrição do serviço'
      }]
    });
  };

  const removeService = (index: number) => {
    const newServices = settings.services.filter((_, i) => i !== index);
    setSettings({ ...settings, services: newServices });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Economia
          </CardTitle>
          <CardDescription>
            Configure os valores de custo/hora dos serviços e o preço da plataforma.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Cost */}
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">Custo Mensal DrGeFin</Label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">R$</span>
            <Input
              type="number"
              value={settings.platformMonthlyCost}
              onChange={(e) => setSettings({ ...settings, platformMonthlyCost: Number(e.target.value) })}
              className="w-32"
            />
            <span className="text-muted-foreground">/mês</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Este valor será exibido como o custo da plataforma na comparação com consultores.
          </p>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Serviços de Consultoria</h3>
            <Button variant="outline" size="sm" onClick={addService}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>

          {settings.services.map((service, index) => (
            <div key={service.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">
                  Serviço {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeService(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Serviço</Label>
                  <Input
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                    placeholder="Ex: Análise Financeira"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={service.description}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    placeholder="Ex: Fluxo de caixa, DRE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Custo/Hora (R$)</Label>
                  <Input
                    type="number"
                    value={service.hourlyRate}
                    onChange={(e) => updateService(index, 'hourlyRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Horas</Label>
                  <Input
                    type="number"
                    value={service.maxHours}
                    onChange={(e) => updateService(index, 'maxHours', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas Padrão</Label>
                  <Input
                    type="number"
                    value={service.defaultHours}
                    onChange={(e) => updateService(index, 'defaultHours', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo Mensal Padrão</Label>
                  <div className="h-10 flex items-center text-sm text-muted-foreground">
                    R$ {(service.hourlyRate * service.defaultHours).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="font-medium text-sm">Pré-visualização (valores padrão)</h4>
          <div className="text-sm text-muted-foreground">
            <p>Custo total consultores: <span className="text-destructive font-medium">
              R$ {settings.services.reduce((acc, s) => acc + (s.hourlyRate * s.defaultHours), 0).toLocaleString('pt-BR')}/mês
            </span></p>
            <p>Custo DrGeFin: <span className="text-primary font-medium">
              R$ {settings.platformMonthlyCost.toLocaleString('pt-BR')}/mês
            </span></p>
            <p>Economia mensal: <span className="text-success font-medium">
              R$ {(settings.services.reduce((acc, s) => acc + (s.hourlyRate * s.defaultHours), 0) - settings.platformMonthlyCost).toLocaleString('pt-BR')}
            </span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
