/**
 * @fileoverview Configurações de Áudio WhatsApp - DrGeFin
 * 
 * Painel administrativo para ativar/desativar suporte a áudio
 * e definir o limite de duração de mensagens de voz no WhatsApp.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, Mic, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface WhatsAppAudioSettings {
  audio_enabled: boolean;
  max_audio_duration_minutes: number;
}

const defaultSettings: WhatsAppAudioSettings = {
  audio_enabled: true,
  max_audio_duration_minutes: 2,
};

// Custo do Whisper: $0.006 por minuto
const WHISPER_COST_PER_MINUTE = 0.006;

export function WhatsAppAudioSettings() {
  const queryClient = useQueryClient();
  const [audioEnabled, setAudioEnabled] = useState(defaultSettings.audio_enabled);
  const [maxDuration, setMaxDuration] = useState(defaultSettings.max_audio_duration_minutes);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-whatsapp-audio-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'whatsapp_audio_settings')
        .maybeSingle();

      if (error) throw error;
      return data?.value as unknown as WhatsAppAudioSettings | null;
    },
  });

  useEffect(() => {
    if (settings) {
      setAudioEnabled(settings.audio_enabled ?? defaultSettings.audio_enabled);
      setMaxDuration(settings.max_audio_duration_minutes ?? defaultSettings.max_audio_duration_minutes);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newValue: WhatsAppAudioSettings = {
        audio_enabled: audioEnabled,
        max_audio_duration_minutes: maxDuration,
      };

      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'whatsapp_audio_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: newValue as any })
          .eq('key', 'whatsapp_audio_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert([{
            key: 'whatsapp_audio_settings',
            value: newValue as any,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-whatsapp-audio-settings'] });
      toast.success('Configurações de áudio salvas!');
    },
    onError: (error) => {
      console.error('Error saving audio settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  const estimatedMaxCost = maxDuration * WHISPER_COST_PER_MINUTE;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Configurações de Áudio
        </CardTitle>
        <CardDescription>
          Controle o suporte a mensagens de voz no WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle de Ativação */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="audio-enabled" className="text-base">
              Suporte a Áudio
            </Label>
            <p className="text-sm text-muted-foreground">
              Permite receber e transcrever mensagens de voz
            </p>
          </div>
          <Switch
            id="audio-enabled"
            checked={audioEnabled}
            onCheckedChange={setAudioEnabled}
          />
        </div>

        {/* Slider de Duração */}
        <div className={`space-y-4 ${!audioEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Limite de Duração</Label>
              <Badge variant="secondary">{maxDuration} minuto{maxDuration > 1 ? 's' : ''}</Badge>
            </div>
            <Slider
              value={[maxDuration]}
              onValueChange={([value]) => setMaxDuration(value)}
              min={1}
              max={10}
              step={1}
              disabled={!audioEnabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 min</span>
              <span>10 min</span>
            </div>
          </div>

          {/* Custo Estimado */}
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Custo Estimado</p>
              <p className="text-xs text-muted-foreground">
                Até ${estimatedMaxCost.toFixed(3)} por áudio (OpenAI Whisper)
              </p>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
