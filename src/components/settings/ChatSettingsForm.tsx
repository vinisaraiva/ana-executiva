/**
 * @fileoverview Formulário de Configurações do Chat - DrGeFin
 * 
 * Componente para configurar a personalidade e comportamento
 * do assistente de IA, incluindo nome, tom de voz, uso de
 * emojis e instruções personalizadas.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useChatSettings } from '@/hooks/useChatSettings';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Loader2, Save, Hash, Sparkles, Eye, MessageSquare } from 'lucide-react';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Opções de personalidade do assistente de IA.
 */
const personalities = [
  { value: 'profissional', label: 'Profissional', description: 'Objetivo e focado em resultados' },
  { value: 'amigável', label: 'Amigável', description: 'Acessível e explicativo' },
  { value: 'técnico', label: 'Técnico', description: 'Detalhista e preciso' },
  { value: 'executivo', label: 'Executivo', description: 'Direto e focado em decisões' },
];

const tones = [
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
  { value: 'neutro', label: 'Neutro' },
];

const previewQuestion = "Como foram minhas vendas este mês?";

const getPreviewResponse = (personality: string, tone: string, useEmojis: boolean): string => {
  const responses: Record<string, Record<string, string>> = {
    'amigável': {
      'formal': `Olá! Analisei seus dados e as vendas deste mês estão indo muito bem.${useEmojis ? ' 📊' : ''} Você teve um crescimento de 15% comparado ao mês anterior. Quer que eu detalhe por categoria?`,
      'informal': `Opa! Olha só, suas vendas tão bombando!${useEmojis ? ' 🚀' : ''} Subiu 15% em relação ao mês passado. Show, né? Posso te mostrar mais detalhes se quiser!`,
      'neutro': `Olá! Suas vendas deste mês apresentaram crescimento de 15% em relação ao período anterior.${useEmojis ? ' 📈' : ''} Posso detalhar os números se precisar.`,
    },
    'profissional': {
      'formal': `Conforme análise dos dados, as vendas deste mês apresentaram crescimento de 15% em comparação ao período anterior.${useEmojis ? ' 📊' : ''} Recomendo atenção aos produtos com maior margem de contribuição.`,
      'informal': `Suas vendas cresceram 15% comparado ao mês passado.${useEmojis ? ' 📈' : ''} Tá indo bem! Sugiro dar uma olhada nos produtos que mais contribuíram pra isso.`,
      'neutro': `As vendas deste mês registraram alta de 15% sobre o mês anterior.${useEmojis ? ' 📊' : ''} Os principais fatores foram aumento no ticket médio e maior volume de pedidos.`,
    },
    'técnico': {
      'formal': `Análise concluída. Variação mensal: +15,3% (R$ 45.230,00 → R$ 52.150,89).${useEmojis ? ' 📊' : ''} Composição: ticket médio +8,2%, volume +6,5%. Metodologia: comparativo same-store-sales.`,
      'informal': `Rodei os números aqui: +15,3% de crescimento.${useEmojis ? ' 📈' : ''} O ticket médio subiu 8,2% e o volume 6,5%. Quer que eu quebre isso por categoria ou vendedor?`,
      'neutro': `Resultado mensal: crescimento de 15,3%.${useEmojis ? ' 📊' : ''} Detalhamento: ticket médio (+8,2%), volume de vendas (+6,5%). Base comparativa: mês anterior, mesmas lojas.`,
    },
    'executivo': {
      'formal': `Vendas: +15% vs. mês anterior.${useEmojis ? ' ✅' : ''} Destaque: ticket médio. Próxima ação: revisar mix de produtos premium.`,
      'informal': `Resumo rápido: vendas subiram 15%.${useEmojis ? ' 👍' : ''} Ticket médio puxou o resultado. Sugiro olhar o mix de produtos.`,
      'neutro': `Vendas do mês: +15%.${useEmojis ? ' 📈' : ''} Principal driver: ticket médio. Recomendação: avaliar estratégia de produtos premium.`,
    },
  };

  return responses[personality]?.[tone] || responses['profissional']['formal'];
};

export function ChatSettingsForm() {
  const { settings, loading, saveSettings, saving } = useChatSettings();
  const { isPlatformAdmin } = usePlatformAdmin();
  
  const [aiName, setAiName] = useState('');
  const [aiPersonality, setAiPersonality] = useState('profissional');
  const [tone, setTone] = useState('formal');
  const [useEmojis, setUseEmojis] = useState(true);
  const [useMarkdownHeaders, setUseMarkdownHeaders] = useState(false);
  const [useIcons, setUseIcons] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [quickSuggestions, setQuickSuggestions] = useState('');

  useEffect(() => {
    if (settings) {
      setAiName(settings.ai_name || '');
      setAiPersonality(settings.ai_personality || 'profissional');
      setTone(settings.tone || 'formal');
      setUseEmojis(settings.use_emojis ?? true);
      setUseMarkdownHeaders(settings.use_markdown_headers ?? false);
      setUseIcons(settings.use_icons ?? true);
      setCustomInstructions(settings.custom_instructions || '');
      setGreetingMessage(settings.greeting_message || '');
      setQuickSuggestions(settings.quick_suggestions?.join('\n') || '');
    }
  }, [settings]);

  const handleSave = () => {
    saveSettings({
      ai_name: aiName,
      ai_personality: aiPersonality,
      tone: tone,
      use_emojis: useEmojis,
      use_markdown_headers: useMarkdownHeaders,
      use_icons: useIcons,
      custom_instructions: customInstructions || null,
      greeting_message: greetingMessage || null,
      quick_suggestions: quickSuggestions.split('\n').filter(s => s.trim()),
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personality & Tone - Visible to all users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Personalidade da IA
          </CardTitle>
          <CardDescription>Defina como o assistente deve se comportar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ai-name">Nome do Assistente</Label>
            <Input
              id="ai-name"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              placeholder="Assistente Financeiro"
            />
          </div>

          <div className="space-y-2">
            <Label>Personalidade</Label>
            <Select value={aiPersonality} onValueChange={setAiPersonality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {personalities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div>
                      <span className="font-medium">{p.label}</span>
                      <span className="text-muted-foreground ml-2">- {p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tom de Voz</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-dashed border-primary/30 bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Preview da Combinação
          </CardTitle>
          <CardDescription className="text-xs">
            Veja como {aiName || 'o assistente'} responderá com estas configurações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{personalities.find(p => p.value === aiPersonality)?.label}</Badge>
            <span className="text-muted-foreground">+</span>
            <Badge variant="outline">{tones.find(t => t.value === tone)?.label}</Badge>
          </div>
          
          <div className="rounded-lg bg-background p-4 border">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              Você: "{previewQuestion}"
            </div>
            <div className="text-sm">
              <span className="font-medium text-primary">{aiName || 'Assistente'}:</span>
              <p className="mt-1 text-foreground leading-relaxed">
                {getPreviewResponse(aiPersonality, tone, useEmojis)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPlatformAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Formatação das Respostas
            </CardTitle>
            <CardDescription>Configure como as respostas serão exibidas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Usar Ícones</Label>
                <p className="text-sm text-muted-foreground">
                  📊 para relatórios, 👤 para vendedores, 👍 para sucesso
                </p>
              </div>
              <Switch checked={useIcons} onCheckedChange={setUseIcons} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Usar Emojis</Label>
                <p className="text-sm text-muted-foreground">
                  Emojis adicionais nas respostas
                </p>
              </div>
              <Switch checked={useEmojis} onCheckedChange={setUseEmojis} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Títulos Markdown (#)</Label>
                <p className="text-sm text-muted-foreground">
                  Usar # para títulos (desative para texto simples)
                </p>
              </div>
              <Switch checked={useMarkdownHeaders} onCheckedChange={setUseMarkdownHeaders} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Instructions - Platform Admin only */}
      {isPlatformAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Instruções Personalizadas</CardTitle>
            <CardDescription>Adicione comandos ou regras específicas para a IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="greeting">Mensagem de Boas-vindas</Label>
              <Input
                id="greeting"
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                placeholder="Olá! Como posso ajudar com seus dados financeiros?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestions">Sugestões Rápidas (uma por linha)</Label>
              <Textarea
                id="suggestions"
                value={quickSuggestions}
                onChange={(e) => setQuickSuggestions(e.target.value)}
                placeholder="Qual foi meu faturamento?&#10;Quais alertas devo verificar?&#10;Como estão minhas vendas?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções Adicionais</Label>
              <Textarea
                id="instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex: Sempre mencione o período dos dados ao responder. Foque em métricas de margem."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
