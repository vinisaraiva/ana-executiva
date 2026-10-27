/**
 * @fileoverview Gerenciador de Configurações da Landing Page - DrGeFin
 * 
 * Painel administrativo para editar textos e conteúdos da
 * landing page, incluindo hero, features, how-it-works e FAQ.
 * Alterações são salvas no banco e aplicadas em tempo real.
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de uma feature da landing page.
 */
interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface LandingSettings {
  hero_headline: string;
  hero_subtitle: string;
  hero_cta_text: string;
  features: Feature[];
  how_it_works: HowItWorksStep[];
  faq: FAQItem[];
}

const defaultSettings: LandingSettings = {
  hero_headline: 'Analise suas vendas com IA em minutos',
  hero_subtitle: 'Importe seus dados, converse com a IA e descubra insights que aumentam sua margem de lucro.',
  hero_cta_text: 'Começar Gratuitamente',
  features: [],
  how_it_works: [],
  faq: []
};

export function LandingSettingsManager() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<LandingSettings>(defaultSettings);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-landing-settings'],
    queryFn: async (): Promise<LandingSettings> => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'landing_page_settings')
        .maybeSingle();

      if (error) throw error;
      if (!data?.value) return defaultSettings;
      const val = data.value as unknown as LandingSettings;
      return {
        hero_headline: val.hero_headline || defaultSettings.hero_headline,
        hero_subtitle: val.hero_subtitle || defaultSettings.hero_subtitle,
        hero_cta_text: val.hero_cta_text || defaultSettings.hero_cta_text,
        features: val.features || [],
        how_it_works: val.how_it_works || [],
        faq: val.faq || []
      };
    }
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: LandingSettings) => {
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'landing_page_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: newSettings as unknown as Json })
          .eq('key', 'landing_page_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert([{ key: 'landing_page_settings', value: newSettings as unknown as Json }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-settings'] });
      queryClient.invalidateQueries({ queryKey: ['landing-settings'] });
      toast.success('Configurações salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const newFeatures = [...settings.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setSettings({ ...settings, features: newFeatures });
  };

  const addFeature = () => {
    setSettings({
      ...settings,
      features: [...settings.features, { icon: 'Star', title: '', description: '' }]
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = settings.features.filter((_, i) => i !== index);
    setSettings({ ...settings, features: newFeatures });
  };

  const updateStep = (index: number, field: keyof HowItWorksStep, value: string | number) => {
    const newSteps = [...settings.how_it_works];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSettings({ ...settings, how_it_works: newSteps });
  };

  const addStep = () => {
    setSettings({
      ...settings,
      how_it_works: [...settings.how_it_works, { step: settings.how_it_works.length + 1, title: '', description: '' }]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = settings.how_it_works.filter((_, i) => i !== index);
    setSettings({ ...settings, how_it_works: newSteps });
  };

  const updateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    const newFAQ = [...settings.faq];
    newFAQ[index] = { ...newFAQ[index], [field]: value };
    setSettings({ ...settings, faq: newFAQ });
  };

  const addFAQ = () => {
    setSettings({
      ...settings,
      faq: [...settings.faq, { question: '', answer: '' }]
    });
  };

  const removeFAQ = (index: number) => {
    const newFAQ = settings.faq.filter((_, i) => i !== index);
    setSettings({ ...settings, faq: newFAQ });
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
          <CardTitle>Configurações da Landing Page</CardTitle>
          <CardDescription>
            Edite os textos e conteúdos da página de vendas.
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
      <CardContent>
        <Tabs defaultValue="hero" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="how-it-works">Como Funciona</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero_headline">Título Principal</Label>
              <Input
                id="hero_headline"
                value={settings.hero_headline}
                onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Subtítulo</Label>
              <Textarea
                id="hero_subtitle"
                value={settings.hero_subtitle}
                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_cta_text">Texto do Botão CTA</Label>
              <Input
                id="hero_cta_text"
                value={settings.hero_cta_text}
                onChange={(e) => setSettings({ ...settings, hero_cta_text: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Ícones disponíveis: MessageSquare, BarChart3, Upload, Shield
              </p>
              <Button variant="outline" size="sm" onClick={addFeature}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            {settings.features.map((feature, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Feature {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <Input
                      value={feature.icon}
                      onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                      placeholder="MessageSquare"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={feature.title}
                      onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="how-it-works" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Passo
              </Button>
            </div>
            
            {settings.how_it_works.map((step, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Passo {step.step}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={addFAQ}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
            
            {settings.faq.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">FAQ {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFAQ(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Input
                    value={item.question}
                    onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resposta</Label>
                  <Textarea
                    value={item.answer}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
