/**
 * @fileoverview Hook de Configurações do Chat IA - DrGeFin
 * 
 * Este arquivo gerencia as configurações personalizáveis do chat com IA.
 * Cada tenant pode customizar aspectos como nome do assistente,
 * personalidade, tom de resposta e instruções personalizadas.
 * 
 * Configurações disponíveis:
 * - Nome e personalidade do assistente
 * - Tom das respostas (formal, casual, etc.)
 * - Uso de emojis, ícones e cabeçalhos markdown
 * - Instruções personalizadas para o modelo
 * - Mensagem de saudação
 * - Sugestões rápidas de perguntas
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { useToast } from './use-toast';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface que define todas as configurações do chat.
 */
export interface ChatSettings {
  /** ID do tenant proprietário das configurações */
  tenant_id: string;
  /** Nome de exibição do assistente IA */
  ai_name: string;
  /** Personalidade do assistente (profissional, amigável, etc.) */
  ai_personality: string;
  /** Tom das respostas (formal, casual, técnico) */
  tone: string;
  /** Se deve usar emojis nas respostas */
  use_emojis: boolean;
  /** Se deve usar cabeçalhos markdown (##, ###) */
  use_markdown_headers: boolean;
  /** Se deve usar ícones nas respostas */
  use_icons: boolean;
  /** Instruções personalizadas para o modelo (prompt adicional) */
  custom_instructions: string | null;
  /** Mensagem de saudação inicial do chat */
  greeting_message: string | null;
  /** Lista de sugestões rápidas de perguntas */
  quick_suggestions: string[];
}

// ============================================================================
// CONFIGURAÇÕES PADRÃO
// ============================================================================

/**
 * Configurações padrão usadas quando o tenant ainda não personalizou.
 * Estas são aplicadas automaticamente para novos tenants.
 */
const defaultSettings: Omit<ChatSettings, 'tenant_id'> = {
  ai_name: 'Assistente Financeiro',
  ai_personality: 'profissional',
  tone: 'formal',
  use_emojis: true,
  use_markdown_headers: false,
  use_icons: true,
  custom_instructions: null,
  greeting_message: null,
  quick_suggestions: [
    'Qual foi meu faturamento?', 
    'Quais alertas devo verificar?', 
    'Como estão minhas vendas?'
  ],
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para gerenciar configurações do chat IA.
 * 
 * Busca as configurações do tenant atual e fornece função para salvá-las.
 * Se não existirem configurações salvas, retorna os valores padrão.
 * 
 * @returns Objeto com settings, loading, saveSettings e saving
 * 
 * @example
 * const { settings, saveSettings, loading, saving } = useChatSettings();
 * 
 * // Acessar configuração
 * console.log(settings?.ai_name);
 * 
 * // Salvar nova configuração
 * saveSettings({ ai_name: 'Dr. GeFin', use_emojis: true });
 */
export function useChatSettings() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================================================
  // QUERY: Buscar configurações do tenant
  // ============================================================================

  const query = useQuery({
    queryKey: ['chat-settings', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      // Busca as configurações do tenant (se existirem)
      const { data, error } = await supabase
        .from('chat_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle(); // Retorna null se não encontrar

      if (error) throw error;

      if (data) {
        // Configurações encontradas - retorna com quick_suggestions convertido
        return {
          ...data,
          quick_suggestions: data.quick_suggestions as string[] || defaultSettings.quick_suggestions,
        } as ChatSettings;
      }

      // Nenhuma configuração salva - retorna valores padrão
      return { tenant_id: tenant.id, ...defaultSettings } as ChatSettings;
    },
    enabled: !!tenant?.id, // Só executa se houver tenant
  });

  // ============================================================================
  // MUTATION: Salvar configurações
  // ============================================================================

  const mutation = useMutation({
    mutationFn: async (settings: Partial<ChatSettings>) => {
      if (!tenant?.id) throw new Error('Nenhum tenant selecionado');

      // Verifica se já existem configurações para este tenant
      const { data: existing } = await supabase
        .from('chat_settings')
        .select('tenant_id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (existing) {
        // UPDATE: Atualiza configurações existentes
        const { error } = await supabase
          .from('chat_settings')
          .update({
            ...settings,
            // Cast necessário porque o Supabase espera JSON
            quick_suggestions: settings.quick_suggestions as unknown as string,
          })
          .eq('tenant_id', tenant.id);

        if (error) throw error;
      } else {
        // INSERT: Cria novas configurações
        const { error } = await supabase
          .from('chat_settings')
          .insert({
            tenant_id: tenant.id,
            ...defaultSettings,
            ...settings,
            quick_suggestions: (settings.quick_suggestions || defaultSettings.quick_suggestions) as unknown as string,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalida o cache para recarregar as configurações
      queryClient.invalidateQueries({ queryKey: ['chat-settings', tenant?.id] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do chat foram atualizadas.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações do chat:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    },
  });

  return {
    /** Configurações atuais do chat */
    settings: query.data,
    /** Indica se está carregando as configurações */
    loading: query.isLoading,
    /** Função para salvar configurações (parciais ou completas) */
    saveSettings: mutation.mutate,
    /** Indica se está salvando as configurações */
    saving: mutation.isPending,
  };
}
