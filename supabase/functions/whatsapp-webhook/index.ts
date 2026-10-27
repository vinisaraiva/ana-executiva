import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface para configurações de áudio
interface AudioSettings {
  enabled: boolean;
  maxSizeBytes: number;
  maxDurationMinutes: number;
}

// Buscar configurações de áudio do banco
async function getAudioSettings(supabase: SupabaseClient): Promise<AudioSettings> {
  try {
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "whatsapp_audio_settings")
      .maybeSingle();
    
    const settings = data?.value as { audio_enabled?: boolean; max_audio_duration_minutes?: number } | null;
    
    const maxDurationMinutes = settings?.max_audio_duration_minutes ?? 2;
    
    return {
      enabled: settings?.audio_enabled ?? true,
      maxSizeBytes: maxDurationMinutes * 1024 * 1024, // ~1MB por minuto
      maxDurationMinutes,
    };
  } catch (error) {
    console.error("Erro ao buscar configurações de áudio:", error);
    // Retornar defaults em caso de erro
    return {
      enabled: true,
      maxSizeBytes: 2 * 1024 * 1024,
      maxDurationMinutes: 2,
    };
  }
}

// Tipos
interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { 
    id: string;
    mime_type: string;
  };
}

interface WebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: WhatsAppMessage[];
      };
      field: string;
    }>;
  }>;
}

// Tipos para os dados do run_facts
interface VendedorRanking {
  nome: string;
  faturamento: number;
  margem_percentual?: number;
  qtd_pedidos?: number;
  quantidade?: number;
}

interface ProdutoRanking {
  nome: string;
  faturamento: number;
  quantidade?: number;
  margem_percentual?: number;
}

interface ClienteRanking {
  nome: string;
  faturamento: number;
  qtd_pedidos?: number;
  ticket_medio?: number;
}

interface CanalData {
  nome: string;
  faturamento: number;
  qtd_pedidos: number;
  percentual: number;
}

interface TemporalData {
  por_mes?: Array<{ mes: string; faturamento: number; crescimento_mom?: number | null }>;
  melhor_dia?: { data: string; faturamento: number };
  pior_dia?: { data: string; faturamento: number };
  media_diaria?: number;
  total_dias_com_vendas?: number;
}

interface CidadeData {
  nome: string;
  faturamento: number;
  percentual?: number;
}

interface VendedoresData {
  ranking_faturamento?: VendedorRanking[];
  bottom_20_faturamento?: VendedorRanking[];
  bottom_20_margem?: VendedorRanking[];
  ranking_quantidade?: VendedorRanking[];
  total_vendedores?: number;
}

interface ProdutosData {
  top_20_faturamento?: ProdutoRanking[];
  top_20_margem?: ProdutoRanking[];
  bottom_20_faturamento?: ProdutoRanking[];
  bottom_20_margem?: ProdutoRanking[];
  curva_abc?: Record<string, unknown>;
  total_produtos?: number;
}

interface ClientesData {
  top_20_faturamento?: ClienteRanking[];
  top_20_frequencia?: ClienteRanking[];
  bottom_20_faturamento?: ClienteRanking[];
  clientes_recorrentes?: number;
  clientes_novos?: number;
  total_clientes?: number;
}

interface CidadesData {
  top_20?: CidadeData[];
  bottom_20?: CidadeData[];
}

// Tipo para comandos do banco
interface WhatsAppCommandDB {
  id: string;
  command_key: string;
  command_aliases: string[];
  display_name: string;
  description: string | null;
  icon: string;
  response_type: 'template' | 'data_query' | 'ai_prompt';
  response_template: string | null;
  data_source: string | null;
  limit_items: number | null;
  ai_prompt: string | null;
  is_active: boolean;
  sort_order: number;
}

// Função para enviar mensagem WhatsApp
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("Missing WhatsApp credentials");
    return false;
  }

  // WhatsApp tem limite de 4096 caracteres por mensagem
  const maxLength = 4000;
  const messages = [];
  
  if (message.length <= maxLength) {
    messages.push(message);
  } else {
    // Dividir em múltiplas mensagens
    let remaining = message;
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        messages.push(remaining);
        break;
      }
      // Encontrar ponto de quebra (preferir quebra de linha ou espaço)
      let breakPoint = remaining.lastIndexOf("\n", maxLength);
      if (breakPoint < maxLength / 2) {
        breakPoint = remaining.lastIndexOf(" ", maxLength);
      }
      if (breakPoint < maxLength / 2) {
        breakPoint = maxLength;
      }
      messages.push(remaining.substring(0, breakPoint));
      remaining = remaining.substring(breakPoint).trim();
    }
  }

  try {
    for (const msg of messages) {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: { preview_url: false, body: msg },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("WhatsApp API error:", error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

// Baixar mídia do WhatsApp (áudio, imagem, etc)
async function downloadWhatsAppMedia(mediaId: string): Promise<ArrayBuffer | null> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  
  try {
    // Passo 1: Obter URL do arquivo
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!mediaResponse.ok) {
      console.error("Erro ao obter URL da mídia:", await mediaResponse.text());
      return null;
    }
    
    const mediaData = await mediaResponse.json();
    const downloadUrl = mediaData.url;
    
    // Passo 2: Baixar o arquivo
    const fileResponse = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!fileResponse.ok) {
      console.error("Erro ao baixar mídia:", await fileResponse.text());
      return null;
    }
    
    return await fileResponse.arrayBuffer();
  } catch (error) {
    console.error("Erro no download de mídia:", error);
    return null;
  }
}

// Transcrever áudio usando OpenAI Whisper
async function transcribeAudio(audioBuffer: ArrayBuffer, mimeType: string): Promise<string | null> {
  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openAIKey) {
    console.error("OPENAI_API_KEY não configurada");
    return null;
  }
  
  try {
    // Determinar extensão baseado no mime type
    const extension = mimeType.includes("ogg") ? "ogg" : 
                      mimeType.includes("mp4") ? "m4a" : 
                      mimeType.includes("mpeg") ? "mp3" : "ogg";
    
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append("file", blob, `audio.${extension}`);
    formData.append("model", "whisper-1");
    formData.append("language", "pt"); // Português
    
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${openAIKey}` 
      },
      body: formData,
    });
    
    if (!response.ok) {
      console.error("OpenAI Whisper error:", await response.text());
      return null;
    }
    
    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return null;
  }
}

// Normalizar número brasileiro para busca (com e sem o 9 do celular)
function normalizePhoneVariants(phone: string): string[] {
  const clean = phone.replace(/\D/g, "");
  const variants: string[] = [clean];

  // Se tem 13 dígitos (55 + DDD + 9 + 8 dígitos), criar variante sem o 9
  // Ex: 5571987566920 -> 557187566920
  if (clean.length === 13 && clean.startsWith("55")) {
    const ddd = clean.substring(2, 4);
    const rest = clean.substring(5); // Pula o 9
    variants.push(`55${ddd}${rest}`);
  }

  // Se tem 12 dígitos (55 + DDD + 8 dígitos), criar variante com o 9
  // Ex: 557187566920 -> 5571987566920
  if (clean.length === 12 && clean.startsWith("55")) {
    const ddd = clean.substring(2, 4);
    const rest = clean.substring(4);
    variants.push(`55${ddd}9${rest}`);
  }

  return [...new Set(variants)];
}

// Buscar comandos ativos (globais + tenant)
async function getActiveCommands(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Map<string, WhatsAppCommandDB>> {
  const commandsMap = new Map<string, WhatsAppCommandDB>();

  // Buscar comandos globais
  const { data: globalCommands } = await supabase
    .from("whatsapp_commands_global")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (globalCommands) {
    for (const cmd of globalCommands) {
      commandsMap.set(cmd.command_key, cmd);
      // Adicionar aliases
      if (cmd.command_aliases) {
        for (const alias of cmd.command_aliases) {
          commandsMap.set(alias.toLowerCase(), cmd);
        }
      }
    }
  }

  // Buscar comandos do tenant (sobrescrevem globais)
  const { data: tenantCommands } = await supabase
    .from("whatsapp_commands")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order");

  if (tenantCommands) {
    for (const cmd of tenantCommands) {
      commandsMap.set(cmd.command_key, cmd);
      if (cmd.command_aliases) {
        for (const alias of cmd.command_aliases) {
          commandsMap.set(alias.toLowerCase(), cmd);
        }
      }
    }
  }

  return commandsMap;
}

// Gerar mensagem de ajuda dinamicamente
function generateHelpMessage(commands: WhatsAppCommandDB[]): string {
  const uniqueCommands = Array.from(
    new Map(commands.map((c) => [c.command_key, c])).values()
  ).sort((a, b) => a.sort_order - b.sort_order);

  let msg = `📱 *Comandos Disponíveis*\n\n`;
  
  for (const cmd of uniqueCommands) {
    if (cmd.command_key === 'ajuda') continue;
    msg += `${cmd.icon} *[${cmd.command_key}]* - ${cmd.description || cmd.display_name}\n`;
  }

  msg += `\n💡 Você também pode fazer perguntas livres como:
• "Qual foi meu faturamento este mês?"
• "Quem é meu melhor vendedor?"
• "Qual produto tem menor margem?"`;

  return msg;
}

// Formatar valor em BRL
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Formatar percentual
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Processar comando especial
async function processCommand(
  command: string,
  facts: Record<string, unknown>,
  anomalies: Array<{ title: string; severity: string; details: Record<string, unknown> }>
): Promise<string> {
  // Campos em português como estão no run_facts
  const empresa = facts.empresa as Record<string, unknown> | undefined;
  const vendedores = facts.vendedores as VendedoresData | undefined;
  const produtos = facts.produtos as ProdutosData | undefined;
  const clientes = facts.clientes as ClientesData | undefined;
  const canais = facts.canais as CanalData[] | undefined;
  const temporal = facts.temporal as TemporalData | undefined;
  const cidades = facts.cidades as CidadesData | undefined;

  switch (command) {
    case "status": {
      const faturamento = (empresa?.total_faturamento_liquido as number) || 0;
      const pedidos = (empresa?.total_pedidos as number) || 0;
      const ticketMedio = (empresa?.ticket_medio as number) || 0;
      const margem = (empresa?.margem_percentual as number) || 0;
      
      return `📊 *STATUS ATUAL*

💰 Faturamento: ${formatCurrency(faturamento)}
📦 Pedidos: ${pedidos.toLocaleString("pt-BR")}
🎯 Ticket Médio: ${formatCurrency(ticketMedio)}
📈 Margem: ${formatPercent(margem)}

Digite *[relatorio]* para mais detalhes!`;
    }

    case "relatorio": {
      const faturamento = (empresa?.total_faturamento_liquido as number) || 0;
      const pedidos = (empresa?.total_pedidos as number) || 0;
      const ticketMedio = (empresa?.ticket_medio as number) || 0;
      const margem = (empresa?.margem_percentual as number) || 0;
      const quantidade = (empresa?.total_itens as number) || 0;
      
      // CORRIGIDO: usar ranking_faturamento em vez de top_20_faturamento
      const topVendedores = vendedores?.ranking_faturamento || [];
      const topProdutos = produtos?.top_20_faturamento || [];
      
      let report = `📈 *RELATÓRIO COMPLETO*

*KPIs Principais:*
💰 Faturamento: ${formatCurrency(faturamento)}
📦 Pedidos: ${pedidos.toLocaleString("pt-BR")}
📊 Quantidade: ${quantidade.toLocaleString("pt-BR")} itens
🎯 Ticket Médio: ${formatCurrency(ticketMedio)}
📈 Margem: ${formatPercent(margem)}

`;

      if (topVendedores.length > 0) {
        report += `*Top 3 Vendedores:*\n`;
        topVendedores.slice(0, 3).forEach((s, i) => {
          report += `${i + 1}. ${s.nome}: ${formatCurrency(s.faturamento)}\n`;
        });
        report += "\n";
      }

      if (topProdutos.length > 0) {
        report += `*Top 3 Produtos:*\n`;
        topProdutos.slice(0, 3).forEach((p, i) => {
          report += `${i + 1}. ${p.nome}: ${formatCurrency(p.faturamento)}\n`;
        });
      }

      if (canais && canais.length > 0) {
        report += `\n*Canais:*\n`;
        canais.slice(0, 4).forEach((c) => {
          report += `• ${c.nome}: ${formatCurrency(c.faturamento)} (${formatPercent(c.percentual)})\n`;
        });
      }

      if (anomalies.length > 0) {
        report += `\n⚠️ *${anomalies.length} alertas* pendentes. Digite *[alertas]* para ver.`;
      }

      return report;
    }

    case "vendedores": {
      // CORRIGIDO: usar ranking_faturamento em vez de top_20_faturamento
      const topVendedores = vendedores?.ranking_faturamento || [];
      
      if (topVendedores.length === 0) {
        return "❌ Nenhum dado de vendedor encontrado.";
      }

      let msg = `👥 *TOP 10 VENDEDORES*\n\n`;
      topVendedores.slice(0, 10).forEach((s, i) => {
        const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        msg += `${emoji} *${s.nome}*\n   💰 ${formatCurrency(s.faturamento)}`;
        if (s.margem_percentual) {
          msg += ` | 📈 ${formatPercent(s.margem_percentual)}`;
        }
        msg += "\n\n";
      });

      return msg;
    }

    case "produtos": {
      const topProdutos = produtos?.top_20_faturamento || [];
      
      if (topProdutos.length === 0) {
        return "❌ Nenhum dado de produto encontrado.";
      }

      let msg = `📦 *TOP 10 PRODUTOS*\n\n`;
      topProdutos.slice(0, 10).forEach((p, i) => {
        const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        msg += `${emoji} *${p.nome}*\n   💰 ${formatCurrency(p.faturamento)}`;
        if (p.quantidade) {
          msg += ` | 📊 ${p.quantidade.toLocaleString("pt-BR")} un.`;
        }
        msg += "\n\n";
      });

      return msg;
    }

    case "clientes": {
      const topClientes = clientes?.top_20_faturamento || [];
      
      if (topClientes.length === 0) {
        return "❌ Nenhum dado de cliente encontrado.";
      }

      let msg = `🏆 *TOP 10 CLIENTES*\n\n`;
      topClientes.slice(0, 10).forEach((c, i) => {
        const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        msg += `${emoji} *${c.nome}*\n   💰 ${formatCurrency(c.faturamento)}`;
        if (c.qtd_pedidos) {
          msg += ` | 📦 ${c.qtd_pedidos} pedidos`;
        }
        msg += "\n\n";
      });

      return msg;
    }

    case "piores": {
      let msg = `📉 *PIORES PERFORMANCES*\n\n`;
      
      // Piores vendedores por faturamento
      const worstSellers = vendedores?.bottom_20_faturamento || [];
      if (worstSellers.length > 0) {
        msg += `*Vendedores com menor faturamento:*\n`;
        worstSellers.slice(0, 5).forEach((s, i) => {
          msg += `${i + 1}. ${s.nome}: ${formatCurrency(s.faturamento)}`;
          if (s.margem_percentual) {
            msg += ` | ${formatPercent(s.margem_percentual)}`;
          }
          msg += "\n";
        });
        msg += "\n";
      }
      
      // Produtos com menor margem
      const worstMarginProducts = produtos?.bottom_20_margem || [];
      if (worstMarginProducts.length > 0) {
        msg += `*Produtos com menor margem:*\n`;
        worstMarginProducts.slice(0, 5).forEach((p, i) => {
          msg += `${i + 1}. ${p.nome}: ${formatPercent(p.margem_percentual || 0)}\n`;
        });
        msg += "\n";
      }
      
      // Clientes com menor faturamento
      const worstClients = clientes?.bottom_20_faturamento || [];
      if (worstClients.length > 0) {
        msg += `*Clientes com menor faturamento:*\n`;
        worstClients.slice(0, 5).forEach((c, i) => {
          msg += `${i + 1}. ${c.nome}: ${formatCurrency(c.faturamento)}\n`;
        });
      }
      
      if (worstSellers.length === 0 && worstMarginProducts.length === 0 && worstClients.length === 0) {
        return "❌ Nenhum dado de ranking disponível.";
      }

      return msg;
    }

    case "tendencias": {
      const meses = temporal?.por_mes || [];
      
      if (meses.length === 0) {
        return "❌ Sem dados temporais disponíveis.";
      }
      
      let msg = `📅 *TENDÊNCIAS*\n\n`;
      msg += `*Evolução Mensal:*\n`;
      meses.forEach(m => {
        const growth = m.crescimento_mom !== null && m.crescimento_mom !== undefined
          ? ` (${m.crescimento_mom > 0 ? '+' : ''}${m.crescimento_mom.toFixed(1)}%)`
          : '';
        msg += `${m.mes}: ${formatCurrency(m.faturamento)}${growth}\n`;
      });
      
      if (temporal?.melhor_dia) {
        msg += `\n🏆 *Melhor dia:* ${temporal.melhor_dia.data}\n   ${formatCurrency(temporal.melhor_dia.faturamento)}`;
      }
      if (temporal?.pior_dia) {
        msg += `\n📉 *Pior dia:* ${temporal.pior_dia.data}\n   ${formatCurrency(temporal.pior_dia.faturamento)}`;
      }
      if (temporal?.media_diaria) {
        msg += `\n\n📊 *Média diária:* ${formatCurrency(temporal.media_diaria)}`;
      }

      return msg;
    }

    case "alertas": {
      if (anomalies.length === 0) {
        return "✅ Nenhum alerta pendente! Seus dados estão normais.";
      }

      let msg = `⚠️ *ALERTAS (${anomalies.length})*\n\n`;
      anomalies.slice(0, 5).forEach((a, i) => {
        const severityEmoji = a.severity === "high" ? "🔴" : a.severity === "medium" ? "🟡" : "🟢";
        msg += `${severityEmoji} *${a.title}*\n`;
        if (a.details?.description) {
          msg += `   ${a.details.description}\n`;
        }
        msg += "\n";
      });

      if (anomalies.length > 5) {
        msg += `\n... e mais ${anomalies.length - 5} alertas.`;
      }

      return msg;
    }

    case "ajuda":
      return "Digite [status] para ver resumo ou faça uma pergunta livre.";

    default:
      return "Comando não reconhecido. Digite [ajuda] para ver opções.";
  }
}

// Constante para limite de histórico (paridade com chat web)
const MAX_HISTORY_MESSAGES = 10;

// Tipo para mensagem do histórico
interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Processar pergunta livre via IA
async function processAIQuestion(
  question: string,
  facts: Record<string, unknown>,
  anomalies: Array<{ title: string; severity: string; details: Record<string, unknown> }>,
  tenantName: string,
  userName: string,
  conversationHistory: HistoryMessage[] = [],
  isFromAudio: boolean = false
): Promise<string> {
  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIKey) {
    return "❌ Serviço de IA temporariamente indisponível.";
  }

  // Campos em português como estão no run_facts - com tipos corretos
  const empresa = facts.empresa as Record<string, unknown> | undefined;
  const vendedores = facts.vendedores as VendedoresData | undefined;
  const produtos = facts.produtos as ProdutosData | undefined;
  const clientes = facts.clientes as ClientesData | undefined;
  const canais = facts.canais as CanalData[] | undefined;
  const categorias = facts.categorias as Array<Record<string, unknown>> | undefined;
  const temporal = facts.temporal as TemporalData | undefined;
  const cidades = facts.cidades as CidadesData | undefined;
  
  // CORRIGIDO: usar ranking_faturamento para vendedores
  const topVendedores = vendedores?.ranking_faturamento?.slice(0, 10) || [];
  const bottomVendedores = vendedores?.bottom_20_faturamento?.slice(0, 5) || [];
  const bottomVendedoresMargem = vendedores?.bottom_20_margem?.slice(0, 5) || [];
  
  const topProdutos = produtos?.top_20_faturamento?.slice(0, 10) || [];
  const topProdutosMargem = produtos?.top_20_margem?.slice(0, 5) || [];
  const bottomProdutos = produtos?.bottom_20_faturamento?.slice(0, 5) || [];
  const bottomProdutosMargem = produtos?.bottom_20_margem?.slice(0, 5) || [];
  
  const topClientes = clientes?.top_20_faturamento?.slice(0, 10) || [];
  const topClientesFrequencia = clientes?.top_20_frequencia?.slice(0, 5) || [];
  const bottomClientes = clientes?.bottom_20_faturamento?.slice(0, 5) || [];
  
  const topCidades = cidades?.top_20?.slice(0, 5) || [];
  
  // Contexto expandido com todos os dados disponíveis
  const context = `
=== DADOS DA EMPRESA ===
${JSON.stringify(empresa || {}, null, 2)}

=== CANAIS DE VENDA ===
${JSON.stringify(canais || [])}

=== CATEGORIAS ===
${JSON.stringify(categorias?.slice(0, 10) || [])}

=== RANKINGS DE VENDEDORES ===
Top 10 por faturamento: ${JSON.stringify(topVendedores)}
Bottom 5 por faturamento: ${JSON.stringify(bottomVendedores)}
Bottom 5 por margem: ${JSON.stringify(bottomVendedoresMargem)}
Total vendedores: ${vendedores?.total_vendedores || 'N/A'}

=== RANKINGS DE PRODUTOS ===
Top 10 por faturamento: ${JSON.stringify(topProdutos)}
Top 5 por margem: ${JSON.stringify(topProdutosMargem)}
Bottom 5 por faturamento: ${JSON.stringify(bottomProdutos)}
Bottom 5 por margem: ${JSON.stringify(bottomProdutosMargem)}
Total produtos: ${produtos?.total_produtos || 'N/A'}

=== RANKINGS DE CLIENTES ===
Top 10 por faturamento: ${JSON.stringify(topClientes)}
Top 5 por frequência (mais pedidos): ${JSON.stringify(topClientesFrequencia)}
Bottom 5 por faturamento: ${JSON.stringify(bottomClientes)}
Clientes recorrentes (>1 pedido): ${clientes?.clientes_recorrentes || 0}
Clientes novos (1 pedido): ${clientes?.clientes_novos || 0}
Total clientes: ${clientes?.total_clientes || 'N/A'}

=== ANÁLISE TEMPORAL ===
Evolução mensal: ${JSON.stringify(temporal?.por_mes || [])}
Melhor dia: ${JSON.stringify(temporal?.melhor_dia || {})}
Pior dia: ${JSON.stringify(temporal?.pior_dia || {})}
Média diária: R$ ${temporal?.media_diaria?.toFixed(2) || 'N/A'}
Dias com vendas: ${temporal?.total_dias_com_vendas || 'N/A'}

=== CIDADES ===
Top 5: ${JSON.stringify(topCidades)}

=== ALERTAS ===
${anomalies.length > 0 ? anomalies.slice(0, 5).map(a => `- ${a.severity.toUpperCase()}: ${a.title}`).join("\n") : "Nenhum alerta"}
`;

  const systemPrompt = `Você é um assistente financeiro da empresa ${tenantName}. 
Responda de forma direta e concisa, ideal para WhatsApp (máximo 500 caracteres quando possível).
Use emojis moderadamente. Formate valores em R$.
O usuário se chama ${userName}.
Seja amigável mas profissional.
Responda apenas com base nos dados fornecidos.
Se não tiver dados suficientes, diga isso claramente.

IMPORTANTE: Você tem acesso a rankings de melhores E piores performers, dados temporais, e muito mais. Use-os para responder perguntas como:
- Qual melhor/pior vendedor, produto ou cliente
- Qual produto tem maior/menor margem
- Como foram as vendas por mês
- Qual foi o melhor/pior dia de vendas
- Quantos clientes são novos vs recorrentes` + (isFromAudio ? `

Nota: Esta mensagem foi transcrita de um áudio. Responda naturalmente sem confirmar a transcrição separadamente. Se necessário para clareza, você pode mencionar brevemente o que entendeu no início da resposta de forma natural.` : '');

  try {
    // Montar mensagens incluindo histórico de conversa
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Adicionar histórico de conversas anteriores (exceto a mensagem atual que será adicionada separadamente)
    for (const msg of conversationHistory.slice(0, -1)) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Adicionar a pergunta atual com contexto
    messages.push({ role: "user", content: `Contexto:\n${context}\n\nPergunta: ${question}` });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return "❌ Erro ao processar sua pergunta. Tente novamente.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "❌ Não consegui gerar uma resposta.";
  } catch (error) {
    console.error("AI processing error:", error);
    return "❌ Erro ao processar sua pergunta. Tente novamente.";
  }
}

// Handler principal
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // GET - Verificação do webhook (handshake Meta)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }

    console.error("Webhook verification failed", { mode, tokenMatch: token === verifyToken });
    return new Response("Forbidden", { status: 403 });
  }

  // POST - Processar mensagens
  if (req.method === "POST") {
    try {
      const payload: WebhookPayload = await req.json();
      console.log("Received webhook:", JSON.stringify(payload).substring(0, 500));

      // Verificar se é um evento de mensagem
      if (payload.object !== "whatsapp_business_account") {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      // Verificar se é mensagem de texto OU áudio
      if (!message || (message.type !== "text" && message.type !== "audio")) {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const senderPhone = message.from;
      const senderName = value.contacts?.[0]?.profile?.name || "Usuário";
      
      // Criar cliente Supabase (movido para cima para usar nas configurações de áudio)
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      let messageText: string;
      let originalMessageText: string;
      let isAudioMessage = false;

      // Processar áudio se for mensagem de áudio
      if (message.type === "audio" && message.audio?.id) {
        isAudioMessage = true;
        console.log(`Audio message from ${senderPhone}, downloading...`);
        
        // Buscar configurações de áudio
        const audioSettings = await getAudioSettings(supabase);
        
        // Verificar se áudio está habilitado
        if (!audioSettings.enabled) {
          await sendWhatsAppMessage(
            senderPhone, 
            "🔇 Desculpe, mensagens de áudio estão desabilitadas no momento. Por favor, envie sua mensagem como texto."
          );
          return new Response("OK", { status: 200, headers: corsHeaders });
        }
        
        const audioBuffer = await downloadWhatsAppMedia(message.audio.id);
        if (!audioBuffer) {
          await sendWhatsAppMessage(senderPhone, "❌ Não consegui baixar o áudio. Tente novamente.");
          return new Response("OK", { status: 200, headers: corsHeaders });
        }
        
        // Verificar tamanho do áudio usando configuração dinâmica
        if (audioBuffer.byteLength > audioSettings.maxSizeBytes) {
          await sendWhatsAppMessage(
            senderPhone, 
            `⏱️ Áudio muito longo! Por favor, envie um áudio de até ${audioSettings.maxDurationMinutes} minuto${audioSettings.maxDurationMinutes > 1 ? 's' : ''} ou resuma em texto.`
          );
          return new Response("OK", { status: 200, headers: corsHeaders });
        }
        
        console.log(`Transcribing audio (${audioBuffer.byteLength} bytes)...`);
        const transcription = await transcribeAudio(audioBuffer, message.audio.mime_type || "audio/ogg");
        
        if (!transcription) {
          await sendWhatsAppMessage(
            senderPhone, 
            "❌ Não consegui entender o áudio. Tente falar mais claramente ou envie como texto."
          );
          return new Response("OK", { status: 200, headers: corsHeaders });
        }
        
        originalMessageText = transcription.trim();
        messageText = originalMessageText.toLowerCase();
        console.log(`Transcription: "${originalMessageText}"`);
      } else {
        // Mensagem de texto normal
        originalMessageText = message.text!.body.trim();
        messageText = originalMessageText.toLowerCase();
      }

      console.log(`Message from ${senderPhone} (${senderName}): ${messageText}`);

      // Buscar tenant pelo número do remetente (com variantes para formato brasileiro)
      const phoneVariants = normalizePhoneVariants(senderPhone);
      console.log("Phone variants to search:", phoneVariants);

      const { data: account, error: accountError } = await supabase
        .from("whatsapp_accounts")
        .select("tenant_id, user_name, is_active")
        .in("phone_number", phoneVariants)
        .eq("is_active", true)
        .single();

      if (accountError || !account) {
        console.log("Phone not registered:", senderPhone);
        await sendWhatsAppMessage(
          senderPhone,
          "❌ Seu número não está cadastrado. Entre em contato com o administrador para liberar acesso."
        );
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const tenantId = account.tenant_id;
      const userName = account.user_name || senderName;

      // Buscar dados do tenant
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", tenantId)
        .single();

      const tenantName = tenant?.name || "Empresa";

      // Buscar importações ativas
      const { data: activeRuns } = await supabase
        .from("import_runs")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "done")
        .eq("is_active", true);

      if (!activeRuns || activeRuns.length === 0) {
        await sendWhatsAppMessage(
          senderPhone,
          "📊 Ainda não há dados importados. Importe seus dados pelo sistema web primeiro!"
        );
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const runIds = activeRuns.map((r) => r.id);

      // Buscar facts agregados
      const { data: factsData } = await supabase
        .from("run_facts")
        .select("facts")
        .in("import_run_id", runIds);

      // Agregar facts
      const aggregatedFacts: Record<string, unknown> = {};
      if (factsData && factsData.length > 0) {
        // Usar o primeiro por simplicidade (idealmente agregar todos)
        Object.assign(aggregatedFacts, factsData[0].facts);
      }

      // Buscar anomalias
      const { data: anomaliesData } = await supabase
        .from("anomalies")
        .select("title, severity, details")
        .in("import_run_id", runIds)
        .order("severity", { ascending: false })
        .limit(10);

      const anomalies = (anomaliesData || []) as Array<{ title: string; severity: string; details: Record<string, unknown> }>;

      // Buscar comandos dinâmicos do banco
      const commandsMap = await getActiveCommands(supabase, tenantId);
      const matchedCommand = commandsMap.get(messageText);

      // Buscar histórico existente da sessão
      const { data: sessionData } = await supabase
        .from("whatsapp_sessions")
        .select("messages")
        .eq("phone_number", senderPhone)
        .eq("tenant_id", tenantId)
        .single();

      const previousMessages = (sessionData?.messages || []) as HistoryMessage[];
      
      let response: string;

      // Verificar se é comando de limpar histórico
      if (matchedCommand?.command_key === 'limpar' || messageText === 'limpar' || messageText === '[limpar]' || messageText === 'novo' || messageText === '[novo]') {
        // Limpar histórico e iniciar nova conversa
        await supabase
          .from("whatsapp_sessions")
          .upsert(
            {
              phone_number: senderPhone,
              tenant_id: tenantId,
              messages: [],
              last_activity: new Date().toISOString(),
            },
            { onConflict: "phone_number,tenant_id" }
          );
        
        response = "🧹 Histórico limpo! Vamos começar uma nova conversa.\n\nDigite *[ajuda]* para ver os comandos disponíveis ou faça uma pergunta.";
        
        await sendWhatsAppMessage(senderPhone, response);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // Adicionar nova mensagem do usuário ao histórico (marcar se veio de áudio)
      const userContent = isAudioMessage ? `[🎤 Áudio]: ${originalMessageText}` : originalMessageText;
      const updatedMessages: HistoryMessage[] = [
        ...previousMessages,
        { role: "user" as const, content: userContent, timestamp: new Date().toISOString() },
      ];

      // Manter apenas as últimas MAX_HISTORY_MESSAGES
      const trimmedMessages = updatedMessages.slice(-MAX_HISTORY_MESSAGES);

      if (matchedCommand) {
        // Se for comando de ajuda, gerar dinamicamente
        if (matchedCommand.command_key === 'ajuda') {
          const allCommands = Array.from(commandsMap.values());
          response = generateHelpMessage(allCommands);
        } else {
          // Processar comando normal
          response = await processCommand(matchedCommand.command_key, aggregatedFacts, anomalies);
        }
      } else {
        // Pergunta livre - processar via IA COM histórico de conversa
        response = await processAIQuestion(
          originalMessageText,
          aggregatedFacts,
          anomalies,
          tenantName,
          userName,
          trimmedMessages,
          isAudioMessage
        );
      }

      // Enviar resposta
      const sent = await sendWhatsAppMessage(senderPhone, response);
      
      if (!sent) {
        console.error("Failed to send response to", senderPhone);
      }

      // Salvar histórico atualizado COM a resposta
    const finalMessages: HistoryMessage[] = [
      ...trimmedMessages,
      { role: "assistant" as const, content: response, timestamp: new Date().toISOString() },
    ].slice(-MAX_HISTORY_MESSAGES);

      await supabase
        .from("whatsapp_sessions")
        .upsert(
          {
            phone_number: senderPhone,
            tenant_id: tenantId,
            messages: finalMessages,
            last_activity: new Date().toISOString(),
          },
          { onConflict: "phone_number,tenant_id" }
        );

      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});
