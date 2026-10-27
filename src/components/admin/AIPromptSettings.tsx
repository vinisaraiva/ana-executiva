/**
 * @fileoverview Configurações de Prompt da IA - DrGeFin
 * 
 * Painel administrativo para configurar o prompt base da IA,
 * personalidades disponíveis e modelo de linguagem utilizado.
 * Afeta todas as interações de chat da plataforma.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Bot, Sparkles, Eye, EyeOff, Cpu, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Configurações de prompt da IA armazenadas no banco.
 */
interface AIPromptSettings {
  base_system_prompt: string;
  personalities: Record<string, string>;
  ai_model: string;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  costLevel: 1 | 2 | 3 | 4;
  isNew?: boolean;
}

const availableModels: ModelOption[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Mais rápido e econômico. Boa relação custo-benefício para a maioria dos casos.',
    costLevel: 1,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Mais poderoso, melhor para análises complexas e raciocínio avançado.',
    costLevel: 2,
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    description: 'Nova geração, eficiente e poderoso. Excelente para tarefas bem definidas.',
    costLevel: 3,
    isNew: true,
  },
  {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5',
    description: 'Modelo flagship mais recente. Máxima qualidade e capacidade de raciocínio.',
    costLevel: 4,
    isNew: true,
  },
];

const defaultSettings: AIPromptSettings = {
  base_system_prompt: "Você é um gestor financeiro sênior de grandes empresas, especialista em análise de dados financeiros com mais de 20 anos de experiência. Sua missão é ajudar gestores a tomar decisões melhores baseadas em dados.",
  personalities: {
    profissional: "Você é um gestor financeiro experiente e objetivo.",
    amigável: "Você é um consultor amigável e acessível que explica de forma simples.",
    técnico: "Você é um analista técnico detalhista e preciso.",
    executivo: "Você é um consultor executivo direto e focado em resultados.",
  },
  ai_model: 'gpt-4o-mini',
};

const personalityLabels: Record<string, string> = {
  profissional: "Profissional",
  amigável: "Amigável",
  técnico: "Técnico",
  executivo: "Executivo",
};

export function AIPromptSettings() {
  const queryClient = useQueryClient();
  const [basePrompt, setBasePrompt] = useState(defaultSettings.base_system_prompt);
  const [personalities, setPersonalities] = useState<Record<string, string>>(defaultSettings.personalities);
  const [selectedModel, setSelectedModel] = useState(defaultSettings.ai_model);
  const [showPreview, setShowPreview] = useState(false);

  const getCostLabel = (level: number) => {
    return '$'.repeat(level);
  };

  const getSelectedModelInfo = () => {
    return availableModels.find(m => m.id === selectedModel) || availableModels[0];
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-ai-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'ai_prompt_settings')
        .maybeSingle();

      if (error) throw error;
      return data?.value as unknown as AIPromptSettings | null;
    },
  });

  useEffect(() => {
    if (settings) {
      setBasePrompt(settings.base_system_prompt || defaultSettings.base_system_prompt);
      setPersonalities(settings.personalities || defaultSettings.personalities);
      setSelectedModel(settings.ai_model || defaultSettings.ai_model);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newValue: AIPromptSettings = {
        base_system_prompt: basePrompt,
        personalities,
        ai_model: selectedModel,
      };

      // Check if exists first
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'ai_prompt_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: newValue as any })
          .eq('key', 'ai_prompt_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert([{
            key: 'ai_prompt_settings',
            value: newValue as any,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-ai-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving AI settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  const handlePersonalityChange = (key: string, value: string) => {
    setPersonalities(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const generatePreview = (personalityKey: string) => {
    const personality = personalities[personalityKey] || '';
    return `${basePrompt}\n\n${personality}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const modelInfo = getSelectedModelInfo();

  return (
    <div className="space-y-6">
      {/* Model Selector Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Modelo de IA
            {modelInfo.isNew && (
              <Badge variant="secondary" className="ml-2">Novo</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Selecione o modelo de IA que será usado para todas as conversas do chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-model">Modelo</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="ai-model">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      {model.isNew && (
                        <Badge variant="outline" className="text-xs">Novo</Badge>
                      )}
                      <span className="text-muted-foreground ml-2">
                        {getCostLabel(model.costLevel)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{modelInfo.name}</span>
              <Badge variant={modelInfo.costLevel <= 2 ? "default" : "destructive"}>
                Custo: {getCostLabel(modelInfo.costLevel)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {modelInfo.description}
            </p>
          </div>

          {modelInfo.costLevel >= 3 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este modelo tem custo significativamente maior. Certifique-se de que o orçamento permite seu uso em produção.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Prompt Base da IA
          </CardTitle>
          <CardDescription>
            Define a descrição e personalidade fundamental da IA que será usada como base para todas as interações.
            Este texto será combinado com a personalidade escolhida pelo tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-prompt">Prompt Base</Label>
            <Textarea
              id="base-prompt"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="Ex: Você é um gestor financeiro sênior de grandes empresas..."
              className="min-h-[150px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Este prompt define quem a IA é e como ela deve se comportar. Será usado para todos os tenants.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Personalidades
          </CardTitle>
          <CardDescription>
            Customize as descrições de cada personalidade. Os tenants podem escolher uma dessas opções nas configurações do chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(personalities).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`personality-${key}`}>
                {personalityLabels[key] || key}
              </Label>
              <Input
                id={`personality-${key}`}
                value={value}
                onChange={(e) => handlePersonalityChange(key, e.target.value)}
                placeholder={`Descrição da personalidade ${key}...`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Collapsible open={showPreview} onOpenChange={setShowPreview}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
                <CardTitle className="flex items-center gap-2 text-base">
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Preview do Prompt
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {showPreview ? 'Ocultar' : 'Mostrar'}
                </span>
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm text-muted-foreground">
                Veja como o prompt final ficará para cada personalidade:
              </p>
              {Object.keys(personalities).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {personalityLabels[key] || key}
                  </Label>
                  <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap border">
                    {generatePreview(key)}
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Separator />

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
