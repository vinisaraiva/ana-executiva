/**
 * @fileoverview Definições de tipos e constantes compartilhadas do Chat
 * 
 * Este módulo contém todas as interfaces, tipos e constantes utilizadas
 * pela edge function de chat com IA.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Configurações do chat personalizadas por tenant.
 * Define nome da IA, personalidade, tom de voz e formatação.
 */
export interface ChatSettings {
  ai_name: string;
  ai_personality: string;
  tone: string;
  use_emojis: boolean;
  use_markdown_headers: boolean;
  use_icons: boolean;
  custom_instructions: string | null;
  greeting_message: string | null;
}

/**
 * Configurações de IA a nível de plataforma.
 * Define o prompt base e personalidades disponíveis.
 */
export interface PlatformAISettings {
  base_system_prompt: string;
  personalities: Record<string, string>;
  ai_model?: string;
}

/**
 * Parâmetros para consultas dinâmicas ao banco de dados.
 * Permite filtrar vendas por diversos critérios.
 */
export interface QueryParams {
  product_name?: string;
  seller_name?: string;
  customer_name?: string;
  city?: string;
  state?: string;
  channel?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Parâmetros para consultas de ranking.
 * Define entidade, métrica, direção, limite e filtros temporais.
 */
export interface RankingParams {
  entity: 'product' | 'seller' | 'customer' | 'city' | 'state' | 'category' | 'channel';
  metric: 'faturamento' | 'quantidade' | 'margem' | 'pedidos';
  direction: 'top' | 'bottom';
  limit?: number;
  start_date?: string;
  end_date?: string;
  group_by_period?: 'month' | 'quarter' | 'year';
}

/**
 * Parâmetros para comparação entre dois períodos.
 * Permite analisar evolução de métricas entre períodos distintos.
 */
export interface ComparePeriodParams {
  period_1_start: string;
  period_1_end: string;
  period_2_start: string;
  period_2_end: string;
  entity: 'product' | 'seller' | 'customer' | 'city' | 'state' | 'category' | 'channel';
  metric?: 'faturamento' | 'quantidade' | 'margem';
  limit?: number;
}

/**
 * Parâmetros para análise de tendências temporais.
 * Identifica automaticamente padrões de crescimento, queda ou estabilidade.
 */
export interface TrendAnalysisParams {
  entity: 'product' | 'seller' | 'customer' | 'city' | 'state' | 'category' | 'channel';
  trend_type?: 'growth' | 'decline' | 'stable' | 'all';
  period_type?: 'month' | 'quarter';
  min_periods?: number;
  metric?: 'faturamento' | 'quantidade' | 'margem';
  limit?: number;
}

/**
 * Resultado da análise de tendência para uma entidade.
 */
export interface TrendResult {
  name: string;
  trend: 'growth' | 'decline' | 'stable';
  avg_growth_rate: number;
  consistency: number;  // R² value (0-1)
  periods_analyzed: number;
  total_change: number;
  consecutive_periods: number;
  data_points: { period: string; value: number }[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Headers CORS para permitir chamadas de qualquer origem.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Lista de modelos de IA permitidos.
 */
export const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-5-mini-2025-08-07', 'gpt-5-2025-08-07'];

/**
 * Modelo padrão quando nenhum é especificado.
 */
export const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Configurações padrão de IA a nível de plataforma.
 */
export const defaultPlatformSettings: PlatformAISettings = {
  base_system_prompt: "Você é um gestor financeiro sênior de grandes empresas, especialista em análise de dados financeiros com mais de 20 anos de experiência. Sua missão é ajudar gestores a tomar decisões melhores baseadas em dados.",
  personalities: {
    profissional: "Você é um gestor financeiro experiente e objetivo.",
    amigável: "Você é um consultor amigável e acessível que explica de forma simples.",
    técnico: "Você é um analista técnico detalhista e preciso.",
    executivo: "Você é um consultor executivo direto e focado em resultados.",
  }
};

/**
 * Configurações padrão do chat quando não há configuração do tenant.
 */
export const defaultSettings: ChatSettings = {
  ai_name: "Assistente Financeiro",
  ai_personality: "profissional",
  tone: "formal",
  use_emojis: true,
  use_markdown_headers: false,
  use_icons: true,
  custom_instructions: null,
  greeting_message: null,
};
