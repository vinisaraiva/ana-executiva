/**
 * @fileoverview Edge Function de Chat com IA para Análise de Vendas
 * 
 * Esta função processa mensagens do usuário e gera respostas usando
 * OpenAI com contexto de dados de vendas do tenant.
 * 
 * Funcionalidades:
 * - Autenticação e validação de acesso ao tenant
 * - Verificação de limites do plano
 * - Agregação de dados de múltiplas importações
 * - Tool calling para consultas dinâmicas
 * - Streaming de respostas
 * - Registro de uso de tokens
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Imports dos módulos locais
import { 
  corsHeaders, 
  defaultSettings, 
  defaultPlatformSettings, 
  ALLOWED_MODELS, 
  DEFAULT_MODEL,
  ChatSettings,
  PlatformAISettings,
  RankingParams,
  ComparePeriodParams,
  TrendAnalysisParams
} from "./types.ts";
import { dynamicQueryTools, executeSecureQuery, executeRankingQuery, executeComparePeriods, executeTrendAnalysis } from "./tools.ts";
import { aggregateMultipleFacts } from "./aggregator.ts";
import { buildAIContext } from "./context-builder.ts";
import { buildSystemPrompt } from "./prompt-builder.ts";

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

serve(async (req) => {
  // Trata requisições preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // =========================================================================
    // AUTENTICAÇÃO
    // =========================================================================
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[Chat] Requisição sem header de autorização");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      console.warn("[Chat] Falha na autenticação:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tenant_id, messages } = await req.json();
    console.log(`[Chat] Usuário ${user.id} iniciando chat no tenant ${tenant_id}`);
    
    // Cliente com service role para operações privilegiadas
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // =========================================================================
    // VALIDAÇÃO DE SEGURANÇA (IDOR Prevention)
    // =========================================================================
    
    const { data: membership } = await serviceClient
      .from("tenant_memberships")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      console.warn(`[SECURITY] Acesso negado: Usuário ${user.id} tentou acessar tenant ${tenant_id}`);
      
      // Registra evento de segurança
      await serviceClient.rpc('log_audit_event', {
        _action: 'access_denied',
        _severity: 'critical',
        _user_id: user.id,
        _user_email: user.email,
        _tenant_id: tenant_id,
        _details: { function: 'chat', attempted_action: 'chat_access' },
        _success: false,
        _error_message: 'User not member of tenant'
      });
      
      return new Response(JSON.stringify({ error: "Access denied to this tenant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // VERIFICAÇÃO DE LIMITES DO PLANO
    // =========================================================================
    
    const { data: limitCheck, error: limitError } = await serviceClient.rpc('check_tenant_limits', {
      _tenant_id: tenant_id,
      _limit_type: 'messages'
    });

    if (limitError) {
      console.error('[Chat] Erro ao verificar limites:', limitError);
    } else if (limitCheck && !limitCheck.allowed) {
      console.log(`[LIMITS] Acesso bloqueado para tenant ${tenant_id}: ${limitCheck.reason}`);
      return new Response(JSON.stringify({
        error: limitCheck.message,
        reason: limitCheck.reason,
        limit_info: {
          current: limitCheck.current,
          limit: limitCheck.limit
        }
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // VALIDAÇÃO DA API KEY
    // =========================================================================
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("[Chat] OPENAI_API_KEY não configurada");
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // CARREGAMENTO DE DADOS DE CONTEXTO
    // =========================================================================
    
    // Perfil do usuário para personalização
    const { data: userProfile } = await serviceClient
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    
    const userName = userProfile?.first_name || null;
    
    // Dados do tenant
    const { data: tenantData } = await serviceClient
      .from("tenants")
      .select("name, sector")
      .eq("id", tenant_id)
      .maybeSingle();
    
    const companyName = tenantData?.name || null;
    const sector = tenantData?.sector || null;
    
    // Configurações de chat do tenant
    const { data: chatSettings } = await serviceClient
      .from("chat_settings")
      .select("*")
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    const settings: ChatSettings = chatSettings || defaultSettings;
    
    // Configurações de IA da plataforma
    const { data: platformSettingsData } = await serviceClient
      .from("platform_settings")
      .select("value")
      .eq("key", "ai_prompt_settings")
      .maybeSingle();
    
    const platformSettings: PlatformAISettings = (platformSettingsData?.value as PlatformAISettings) || defaultPlatformSettings;
    
    // Valida e seleciona modelo de IA
    let aiModel = platformSettings.ai_model || DEFAULT_MODEL;
    if (!ALLOWED_MODELS.includes(aiModel)) {
      console.warn(`[Chat] Modelo inválido "${aiModel}", usando ${DEFAULT_MODEL}`);
      aiModel = DEFAULT_MODEL;
    }
    console.log(`[Chat] Usando modelo: ${aiModel}`);

    // =========================================================================
    // CARREGAMENTO DE DADOS DE VENDAS
    // =========================================================================
    
    // Busca importações ativas
    const { data: activeImports } = await serviceClient
      .from("import_runs")
      .select("id, detected_start_date, detected_end_date")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true)
      .eq("status", "done");

    const activeImportIds = activeImports?.map(i => i.id) || [];
    
    // Busca facts das importações ativas
    let allFacts: any[] = [];
    if (activeImportIds.length > 0) {
      const { data: runFactsData } = await serviceClient
        .from("run_facts")
        .select("facts, import_run_id")
        .eq("tenant_id", tenant_id)
        .in("import_run_id", activeImportIds);
      
      allFacts = runFactsData || [];
    }

    // Busca anomalias das importações ativas
    const { data: anomalies } = await serviceClient
      .from("anomalies")
      .select("*")
      .eq("tenant_id", tenant_id)
      .in("import_run_id", activeImportIds.length > 0 ? activeImportIds : ['none'])
      .order("created_at", { ascending: false })
      .limit(20);

    // =========================================================================
    // CONSTRUÇÃO DO CONTEXTO
    // =========================================================================
    
    // Agrega facts de múltiplas importações
    const aggregatedFacts = aggregateMultipleFacts(allFacts, activeImports || []);
    
    // Constrói contexto e prompt do sistema
    const context = buildAIContext(aggregatedFacts, anomalies || [], settings, allFacts.length, companyName, sector);
    const systemPrompt = buildSystemPrompt(settings, platformSettings, context, userName, companyName, sector);

    console.log(`[Chat] Chamando OpenAI API com ${messages.length} mensagens e tool calling habilitado`);

    // =========================================================================
    // CHAMADA À API OPENAI - PRIMEIRA CHAMADA
    // =========================================================================
    
    const openAIMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];
    
    // Estima tokens do prompt (~4 chars = 1 token)
    const promptText = openAIMessages.map((m: any) => m.content).join(' ');
    const estimatedPromptTokens = Math.ceil(promptText.length / 4);
    
    const firstResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: openAIMessages,
        tools: dynamicQueryTools,
        tool_choice: "auto",
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await firstResponse.text();
      console.error("[Chat] Erro na API OpenAI:", errorText);
      throw new Error("AI gateway error");
    }

    const firstData = await firstResponse.json();
    const assistantMessage = firstData.choices[0].message;

    // =========================================================================
    // PROCESSAMENTO DE TOOL CALLS
    // =========================================================================
    
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Limita a 3 tool calls para evitar sobrecarga
      const MAX_TOOL_CALLS = 3;
      const toolCallsToExecute = assistantMessage.tool_calls.slice(0, MAX_TOOL_CALLS);
      
      if (assistantMessage.tool_calls.length > MAX_TOOL_CALLS) {
        console.log(`[Chat] Tool calls limitados de ${assistantMessage.tool_calls.length} para ${MAX_TOOL_CALLS}`);
      }
      
      console.log(`[Chat] Executando ${toolCallsToExecute.length} tool calls`);
      
      // Executa cada tool call
      const toolResults: any[] = [];
      for (const toolCall of toolCallsToExecute) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`[Chat] Executando tool: ${toolName}`, toolArgs);
        
        let result: string;
        if (toolName === 'query_ranking') {
          result = await executeRankingQuery(
            serviceClient,
            tenant_id,
            activeImportIds,
            toolArgs as RankingParams
          );
        } else if (toolName === 'query_compare_periods') {
          result = await executeComparePeriods(
            serviceClient,
            tenant_id,
            activeImportIds,
            toolArgs as ComparePeriodParams
          );
        } else if (toolName === 'query_trend_analysis') {
          result = await executeTrendAnalysis(
            serviceClient,
            tenant_id,
            activeImportIds,
            toolArgs as TrendAnalysisParams
          );
        } else {
          result = await executeSecureQuery(
            serviceClient,
            tenant_id,
            activeImportIds,
            toolName,
            toolArgs
          );
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: result,
        });
      }

      // Cria mensagem do assistente apenas com os tool_calls que foram executados
      const limitedAssistantMessage = {
        ...assistantMessage,
        tool_calls: toolCallsToExecute,
      };

      // Segunda chamada à API com resultados das tools - streaming
      const secondMessages = [
        ...openAIMessages,
        limitedAssistantMessage,
        ...toolResults,
      ];

      const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiModel,
          messages: secondMessages,
          stream: true,
        }),
      });

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        console.error("[Chat] Erro na segunda chamada OpenAI:", errorText);
        throw new Error("AI gateway error on second call");
      }

      // Stream da resposta final com registro de uso
      return streamResponseWithUsageTracking(
        secondResponse,
        serviceClient,
        tenant_id,
        user.id,
        aiModel,
        estimatedPromptTokens
      );
    }

    // =========================================================================
    // RESPOSTA DIRETA (SEM TOOL CALLS) - STREAMING
    // =========================================================================
    
    const streamResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: openAIMessages,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error("[Chat] Erro no streaming OpenAI:", errorText);
      throw new Error("AI streaming error");
    }

    return streamResponseWithUsageTracking(
      streamResponse,
      serviceClient,
      tenant_id,
      user.id,
      aiModel,
      estimatedPromptTokens
    );

  } catch (error) {
    console.error("[Chat] Erro geral:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Cria um stream de resposta que registra o uso de tokens ao final.
 * 
 * @param response - Response da API OpenAI com streaming
 * @param serviceClient - Cliente Supabase com service role
 * @param tenantId - ID do tenant
 * @param userId - ID do usuário
 * @param model - Modelo de IA utilizado
 * @param estimatedPromptTokens - Estimativa de tokens do prompt
 * @returns Response com streaming e registro de uso
 */
function streamResponseWithUsageTracking(
  response: Response,
  serviceClient: SupabaseClient,
  tenantId: string,
  userId: string,
  model: string,
  estimatedPromptTokens: number
): Response {
  let completionText = '';
  
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      
      // Acumula texto da resposta para estimativa de tokens
      const text = new TextDecoder().decode(chunk);
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) completionText += content;
          } catch {
            // Ignora erros de parse
          }
        }
      }
    },
    async flush() {
      // Registra uso de tokens ao final do streaming
      const estimatedCompletionTokens = Math.ceil(completionText.length / 4);
      const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
      
      console.log(`[Chat] Uso de tokens - Prompt: ~${estimatedPromptTokens}, Completion: ~${estimatedCompletionTokens}, Total: ~${totalTokens}`);
      
      // Registra uso assíncrono (não bloqueia a resposta)
      serviceClient
        .from("chat_usage")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          model: model,
          prompt_tokens: estimatedPromptTokens,
          completion_tokens: estimatedCompletionTokens,
          total_tokens: totalTokens,
        })
        .then(({ error }) => {
          if (error) {
            console.error("[Chat] Erro ao registrar uso:", error);
          }
        });
    }
  });

  return new Response(response.body?.pipeThrough(transformStream), {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}
