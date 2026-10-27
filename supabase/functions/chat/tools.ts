/**
 * @fileoverview Definições de ferramentas e executores de consultas dinâmicas
 * 
 * Este módulo contém as definições de tools para o OpenAI e as funções
 * que executam consultas seguras no banco de dados.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { QueryParams, RankingParams, ComparePeriodParams, TrendAnalysisParams, TrendResult } from "./types.ts";

// ============================================================================
// DEFINIÇÕES DE TOOLS PARA OPENAI
// ============================================================================

/**
 * Ferramentas de consulta dinâmica disponíveis para o modelo de IA.
 * Permitem buscar dados específicos não disponíveis no contexto pré-calculado.
 */
export const dynamicQueryTools = [
  {
    type: "function",
    function: {
      name: "query_product_sales",
      description: "Consulta dados de vendas de um produto específico que não está no contexto pré-calculado. Use quando o usuário perguntar sobre um produto específico que não aparece no Top 20.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Nome ou parte do nome do produto a pesquisar"
          }
        },
        required: ["product_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_seller_sales",
      description: "Consulta dados de vendas de um vendedor específico que não está no contexto pré-calculado. Use quando o usuário perguntar sobre um vendedor específico que não aparece no ranking.",
      parameters: {
        type: "object",
        properties: {
          seller_name: {
            type: "string",
            description: "Nome ou parte do nome do vendedor a pesquisar"
          }
        },
        required: ["seller_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_customer_sales",
      description: "Consulta dados de vendas para um cliente específico que não está no contexto pré-calculado. Use quando o usuário perguntar sobre um cliente específico que não aparece no Top 20.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Nome ou parte do nome do cliente a pesquisar"
          }
        },
        required: ["customer_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_period_sales",
      description: "Consulta dados de vendas de um período específico diferente do período geral. Use quando o usuário perguntar sobre datas específicas, meses ou períodos que precisam de análise detalhada.",
      parameters: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            description: "Data inicial no formato YYYY-MM-DD"
          },
          end_date: {
            type: "string",
            description: "Data final no formato YYYY-MM-DD"
          }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_filtered_sales",
      description: "Consulta vendas com filtros combinados. Use quando o usuário fizer perguntas complexas como 'vendas do vendedor X do produto Y' ou 'vendas em janeiro do produto Z'.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Filtrar por nome do produto (opcional)"
          },
          seller_name: {
            type: "string",
            description: "Filtrar por nome do vendedor (opcional)"
          },
          customer_name: {
            type: "string",
            description: "Filtrar por nome do cliente (opcional)"
          },
          city: {
            type: "string",
            description: "Filtrar por cidade (opcional)"
          },
          state: {
            type: "string",
            description: "Filtrar por estado/UF (opcional)"
          },
          channel: {
            type: "string",
            description: "Filtrar por canal de vendas (opcional)"
          },
          category: {
            type: "string",
            description: "Filtrar por categoria de produto (opcional)"
          },
          start_date: {
            type: "string",
            description: "Data inicial no formato YYYY-MM-DD (opcional)"
          },
          end_date: {
            type: "string",
            description: "Data final no formato YYYY-MM-DD (opcional)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_ranking",
      description: "Consulta rankings dinâmicos de produtos, vendedores, clientes ou cidades. Use quando o usuário perguntar 'qual produto vendeu menos?', 'quem é o pior vendedor?', 'top 5 clientes', 'maiores vendedores por mês', 'ranking de janeiro', etc. Suporta filtros temporais e agrupamento por período.",
      parameters: {
        type: "object",
        properties: {
          entity: {
            type: "string",
            enum: ["product", "seller", "customer", "city", "state", "category", "channel"],
            description: "Tipo de entidade para rankear"
          },
          metric: {
            type: "string",
            enum: ["faturamento", "quantidade", "margem", "pedidos"],
            description: "Métrica para ordenação (faturamento=receita, quantidade=unidades vendidas, margem=margem percentual, pedidos=número de pedidos)"
          },
          direction: {
            type: "string",
            enum: ["top", "bottom"],
            description: "Direção: 'top' para melhores/maiores, 'bottom' para piores/menores"
          },
          limit: {
            type: "number",
            description: "Quantos resultados retornar (padrão: 10, máximo: 50)"
          },
          start_date: {
            type: "string",
            description: "Data inicial no formato YYYY-MM-DD (opcional). Use para filtrar ranking de um período específico."
          },
          end_date: {
            type: "string",
            description: "Data final no formato YYYY-MM-DD (opcional). Use para filtrar ranking de um período específico."
          },
          group_by_period: {
            type: "string",
            enum: ["month", "quarter", "year"],
            description: "Agrupar ranking por período. Use 'month' para perguntas como 'maiores vendedores por mês', 'quarter' para trimestre, 'year' para ano. Mostra a evolução temporal de cada entidade."
          }
        },
        required: ["entity", "metric", "direction"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_compare_periods",
      description: "Compara dados de vendas entre dois períodos diferentes. Use para comparar trimestres, meses ou anos específicos. Ex: 'compare Q1 2024 com Q1 2025', 'compare janeiro de 2024 com janeiro de 2025', 'como foi a evolução do 1º semestre de 2023 para 2024'.",
      parameters: {
        type: "object",
        properties: {
          period_1_start: {
            type: "string",
            description: "Data inicial do primeiro período (YYYY-MM-DD)"
          },
          period_1_end: {
            type: "string",
            description: "Data final do primeiro período (YYYY-MM-DD)"
          },
          period_2_start: {
            type: "string",
            description: "Data inicial do segundo período (YYYY-MM-DD)"
          },
          period_2_end: {
            type: "string",
            description: "Data final do segundo período (YYYY-MM-DD)"
          },
          entity: {
            type: "string",
            enum: ["product", "seller", "customer", "city", "state", "category", "channel"],
            description: "Tipo de entidade para comparar"
          },
          metric: {
            type: "string",
            enum: ["faturamento", "quantidade", "margem"],
            description: "Métrica para comparação (default: faturamento)"
          },
          limit: {
            type: "number",
            description: "Quantidade de itens a mostrar (default: 10, máximo: 30)"
          }
        },
        required: ["period_1_start", "period_1_end", "period_2_start", "period_2_end", "entity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_trend_analysis",
      description: "Analisa tendências de crescimento ou queda ao longo do tempo. Use para perguntas como 'quais produtos estão crescendo', 'vendedores em queda', 'tendências de vendas por canal', 'produtos que mais cresceram nos últimos meses'. Identifica automaticamente padrões temporais e calcula taxa de crescimento, consistência e volatilidade.",
      parameters: {
        type: "object",
        properties: {
          entity: {
            type: "string",
            enum: ["product", "seller", "customer", "city", "state", "category", "channel"],
            description: "Tipo de entidade para analisar tendências"
          },
          trend_type: {
            type: "string",
            enum: ["growth", "decline", "stable", "all"],
            description: "Tipo de tendência: 'growth' (crescimento), 'decline' (queda), 'stable' (estável), 'all' (todas). Default: all"
          },
          period_type: {
            type: "string",
            enum: ["month", "quarter"],
            description: "Granularidade da análise temporal: 'month' (mensal) ou 'quarter' (trimestral). Default: month"
          },
          min_periods: {
            type: "number",
            description: "Mínimo de períodos para considerar na análise (default: 3)"
          },
          metric: {
            type: "string",
            enum: ["faturamento", "quantidade", "margem"],
            description: "Métrica para analisar tendência (default: faturamento)"
          },
          limit: {
            type: "number",
            description: "Quantidade de resultados a retornar (default: 10)"
          }
        },
        required: ["entity"]
      }
    }
  }
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Constrói mensagem de "nenhum resultado" com os filtros aplicados.
 * 
 * @param toolName - Nome da ferramenta utilizada
 * @param params - Parâmetros de consulta
 * @returns Mensagem formatada para o usuário
 */
function buildNoResultsMessage(toolName: string, params: QueryParams): string {
  const filters: string[] = [];
  if (params.product_name) filters.push(`produto "${params.product_name}"`);
  if (params.seller_name) filters.push(`vendedor "${params.seller_name}"`);
  if (params.customer_name) filters.push(`cliente "${params.customer_name}"`);
  if (params.city) filters.push(`cidade "${params.city}"`);
  if (params.state) filters.push(`estado "${params.state}"`);
  if (params.channel) filters.push(`canal "${params.channel}"`);
  if (params.category) filters.push(`categoria "${params.category}"`);
  if (params.start_date && params.end_date) {
    filters.push(`período de ${params.start_date} a ${params.end_date}`);
  }

  return `Nenhum resultado encontrado para: ${filters.join(", ")}. Verifique se o nome está correto ou se existem dados para este filtro.`;
}

/**
 * Agrega e formata os resultados de uma consulta dinâmica.
 * 
 * @param data - Dados retornados da consulta
 * @param toolName - Nome da ferramenta para determinar o formato de saída
 * @param params - Parâmetros utilizados na consulta
 * @returns Resultado formatado em texto
 */
function aggregateQueryResults(data: any[], toolName: string, params: QueryParams): string {
  // Calcula agregados básicos
  const totalGross = data.reduce((sum, row) => sum + (parseFloat(row.gross_value) || 0), 0);
  const totalNet = data.reduce((sum, row) => sum + (parseFloat(row.net_value) || 0), 0);
  const totalCost = data.reduce((sum, row) => sum + (parseFloat(row.cost_value) || 0), 0);
  const totalQuantity = data.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);
  const totalDiscount = data.reduce((sum, row) => sum + (parseFloat(row.discount_value) || 0), 0);
  const totalTax = data.reduce((sum, row) => sum + (parseFloat(row.tax_value) || 0), 0);
  
  // Contagens únicas
  const uniqueProducts = new Set(data.map(r => r.product_name).filter(Boolean)).size;
  const uniqueSellers = new Set(data.map(r => r.seller_name).filter(Boolean)).size;
  const uniqueCustomers = new Set(data.map(r => r.customer_name).filter(Boolean)).size;
  const uniqueDates = new Set(data.map(r => r.sale_date).filter(Boolean)).size;
  
  // Range de datas
  const dates = data.map(r => r.sale_date).filter(Boolean).sort();
  const dateRange = dates.length > 0 ? `${dates[0]} a ${dates[dates.length - 1]}` : "N/A";

  // Calcula margem
  const margin = totalGross > 0 ? ((totalGross - totalCost) / totalGross * 100) : 0;

  // Constrói resultado baseado no tipo de consulta
  let result = `📊 RESULTADO DA CONSULTA DINÂMICA:\n\n`;

  // Adiciona contexto de filtros
  const filters: string[] = [];
  if (params.product_name) filters.push(`Produto: "${params.product_name}"`);
  if (params.seller_name) filters.push(`Vendedor: "${params.seller_name}"`);
  if (params.customer_name) filters.push(`Cliente: "${params.customer_name}"`);
  if (params.city) filters.push(`Cidade: "${params.city}"`);
  if (params.state) filters.push(`Estado: "${params.state}"`);
  if (params.channel) filters.push(`Canal: "${params.channel}"`);
  if (params.category) filters.push(`Categoria: "${params.category}"`);
  if (params.start_date && params.end_date) {
    filters.push(`Período: ${params.start_date} a ${params.end_date}`);
  }

  if (filters.length > 0) {
    result += `Filtros aplicados: ${filters.join(" | ")}\n\n`;
  }

  result += `📈 MÉTRICAS GERAIS:\n`;
  result += `- Total de registros: ${data.length.toLocaleString('pt-BR')}\n`;
  result += `- Período encontrado: ${dateRange}\n`;
  result += `- Dias com vendas: ${uniqueDates}\n\n`;

  result += `💰 FATURAMENTO:\n`;
  result += `- Faturamento Bruto: R$ ${totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  result += `- Faturamento Líquido: R$ ${totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  result += `- Custo Total: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  result += `- Margem Bruta: ${margin.toFixed(1)}%\n`;
  result += `- Desconto Total: R$ ${totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  if (totalTax > 0) {
    result += `- Impostos: R$ ${totalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  }

  result += `\n📦 VOLUMES:\n`;
  result += `- Quantidade vendida: ${totalQuantity.toLocaleString('pt-BR')}\n`;
  result += `- Ticket médio: R$ ${(data.length > 0 ? totalGross / data.length : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;

  // Adiciona breakdowns baseado no tipo de consulta
  if (toolName === "query_product_sales") {
    // Mostra vendedores que venderam este produto
    const sellerMap = new Map<string, { faturamento: number; quantidade: number }>();
    data.forEach(row => {
      const seller = row.seller_name || "Não identificado";
      const current = sellerMap.get(seller) || { faturamento: 0, quantidade: 0 };
      current.faturamento += parseFloat(row.gross_value) || 0;
      current.quantidade += parseFloat(row.quantity) || 0;
      sellerMap.set(seller, current);
    });
    
    const topSellers = Array.from(sellerMap.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 5);

    if (topSellers.length > 0 && uniqueSellers > 1) {
      result += `\n👥 VENDEDORES DESTE PRODUTO (Top 5):\n`;
      topSellers.forEach((s, i) => {
        result += `${i + 1}. ${s.nome}: R$ ${s.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${s.quantidade.toLocaleString('pt-BR')} un\n`;
      });
    }
  }

  if (toolName === "query_seller_sales") {
    // Mostra produtos vendidos por este vendedor
    const productMap = new Map<string, { faturamento: number; quantidade: number }>();
    data.forEach(row => {
      const product = row.product_name || "Não identificado";
      const current = productMap.get(product) || { faturamento: 0, quantidade: 0 };
      current.faturamento += parseFloat(row.gross_value) || 0;
      current.quantidade += parseFloat(row.quantity) || 0;
      productMap.set(product, current);
    });
    
    const topProducts = Array.from(productMap.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 5);

    if (topProducts.length > 0 && uniqueProducts > 1) {
      result += `\n📦 PRODUTOS VENDIDOS (Top 5):\n`;
      topProducts.forEach((p, i) => {
        result += `${i + 1}. ${p.nome}: R$ ${p.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${p.quantidade.toLocaleString('pt-BR')} un\n`;
      });
    }

    // Mostra clientes atendidos
    const customerMap = new Map<string, { faturamento: number; pedidos: number }>();
    data.forEach(row => {
      const customer = row.customer_name || "Não identificado";
      const current = customerMap.get(customer) || { faturamento: 0, pedidos: 0 };
      current.faturamento += parseFloat(row.gross_value) || 0;
      current.pedidos += 1;
      customerMap.set(customer, current);
    });
    
    const topCustomers = Array.from(customerMap.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 5);

    if (topCustomers.length > 0 && uniqueCustomers > 1) {
      result += `\n🏆 CLIENTES ATENDIDOS (Top 5):\n`;
      topCustomers.forEach((c, i) => {
        result += `${i + 1}. ${c.nome}: R$ ${c.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${c.pedidos} vendas\n`;
      });
    }
  }

  if (toolName === "query_customer_sales") {
    // Mostra produtos comprados por este cliente
    const productMap = new Map<string, { faturamento: number; quantidade: number }>();
    data.forEach(row => {
      const product = row.product_name || "Não identificado";
      const current = productMap.get(product) || { faturamento: 0, quantidade: 0 };
      current.faturamento += parseFloat(row.gross_value) || 0;
      current.quantidade += parseFloat(row.quantity) || 0;
      productMap.set(product, current);
    });
    
    const topProducts = Array.from(productMap.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 5);

    if (topProducts.length > 0 && uniqueProducts > 1) {
      result += `\n📦 PRODUTOS COMPRADOS (Top 5):\n`;
      topProducts.forEach((p, i) => {
        result += `${i + 1}. ${p.nome}: R$ ${p.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${p.quantidade.toLocaleString('pt-BR')} un\n`;
      });
    }
  }

  if (toolName === "query_period_sales") {
    // Mostra breakdown mensal
    const monthMap = new Map<string, { faturamento: number; qtd: number }>();
    data.forEach(row => {
      const month = row.sale_date ? row.sale_date.substring(0, 7) : "N/A";
      const current = monthMap.get(month) || { faturamento: 0, qtd: 0 };
      current.faturamento += parseFloat(row.gross_value) || 0;
      current.qtd += 1;
      monthMap.set(month, current);
    });
    
    const months = Array.from(monthMap.entries())
      .map(([mes, stats]) => ({ mes, ...stats }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    if (months.length > 0) {
      result += `\n📅 EVOLUÇÃO NO PERÍODO:\n`;
      months.forEach(m => {
        result += `- ${m.mes}: R$ ${m.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${m.qtd} vendas)\n`;
      });
    }
  }

  // Adiciona resumo de contagens
  result += `\n📊 RESUMO:\n`;
  result += `- Produtos únicos: ${uniqueProducts}\n`;
  result += `- Vendedores únicos: ${uniqueSellers}\n`;
  result += `- Clientes únicos: ${uniqueCustomers}\n`;

  return result;
}

// ============================================================================
// EXECUTORES DE CONSULTA
// ============================================================================

/**
 * Executa uma consulta segura ao banco de dados com os filtros especificados.
 * Protege contra IDOR validando tenant_id e import_run_ids.
 * 
 * @param serviceClient - Cliente Supabase com service role
 * @param tenantId - ID do tenant para validação de segurança
 * @param activeImportIds - IDs de importações ativas do tenant
 * @param toolName - Nome da ferramenta para formatar resultado
 * @param params - Parâmetros de filtro da consulta
 * @returns Resultado formatado em texto
 */
export async function executeSecureQuery(
  serviceClient: SupabaseClient,
  tenantId: string,
  activeImportIds: string[],
  toolName: string,
  params: QueryParams
): Promise<string> {
  console.log(`[Tools] Executando consulta segura: ${toolName}`, params);
  
  if (activeImportIds.length === 0) {
    return "Nenhum dado de vendas disponível. É necessário importar uma planilha de vendas primeiro.";
  }

  try {
    // Inicia construção da query
    let query = serviceClient
      .from("sales_lines")
      .select("product_name, seller_name, customer_name, city, state, channel, category, sale_date, quantity, gross_value, net_value, cost_value, discount_value, tax_value")
      .eq("tenant_id", tenantId)
      .in("import_run_id", activeImportIds);

    // Aplica filtros baseados nos parâmetros
    if (params.product_name) {
      query = query.ilike("product_name", `%${params.product_name}%`);
    }
    if (params.seller_name) {
      query = query.ilike("seller_name", `%${params.seller_name}%`);
    }
    if (params.customer_name) {
      query = query.ilike("customer_name", `%${params.customer_name}%`);
    }
    if (params.city) {
      query = query.ilike("city", `%${params.city}%`);
    }
    if (params.state) {
      query = query.ilike("state", `%${params.state}%`);
    }
    if (params.channel) {
      query = query.ilike("channel", `%${params.channel}%`);
    }
    if (params.category) {
      query = query.ilike("category", `%${params.category}%`);
    }
    if (params.start_date) {
      query = query.gte("sale_date", params.start_date);
    }
    if (params.end_date) {
      query = query.lte("sale_date", params.end_date);
    }

    // Aplica limite por segurança
    query = query.limit(1000);

    const { data, error } = await query;

    if (error) {
      console.error("[Tools] Erro na consulta:", error);
      return `Erro ao consultar dados: ${error.message}`;
    }

    if (!data || data.length === 0) {
      return buildNoResultsMessage(toolName, params);
    }

    // Agrega e formata resultados
    return aggregateQueryResults(data, toolName, params);

  } catch (error) {
    console.error("[Tools] Erro na execução da consulta segura:", error);
    return `Erro ao processar consulta: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
}

/**
 * Executa uma consulta de ranking dinâmico.
 * Permite ordenar entidades por diferentes métricas.
 * 
 * @param serviceClient - Cliente Supabase com service role
 * @param tenantId - ID do tenant para validação de segurança
 * @param activeImportIds - IDs de importações ativas
 * @param params - Parâmetros do ranking (entidade, métrica, direção, limite)
 * @returns Resultado formatado em texto
 */
export async function executeRankingQuery(
  serviceClient: SupabaseClient,
  tenantId: string,
  activeImportIds: string[],
  params: RankingParams
): Promise<string> {
  console.log(`[Tools] Executando consulta de ranking:`, params);
  
  if (activeImportIds.length === 0) {
    return "Nenhum dado de vendas disponível. É necessário importar uma planilha de vendas primeiro.";
  }

  try {
    // Construir query com filtros de data
    let query = serviceClient
      .from("sales_lines")
      .select("product_name, seller_name, customer_name, city, state, channel, category, quantity, gross_value, net_value, cost_value, order_id, sale_date")
      .eq("tenant_id", tenantId)
      .in("import_run_id", activeImportIds);

    // Aplicar filtros de data se fornecidos
    if (params.start_date) {
      query = query.gte("sale_date", params.start_date);
    }
    if (params.end_date) {
      query = query.lte("sale_date", params.end_date);
    }

    const { data, error } = await query.limit(10000);

    if (error) {
      console.error("[Tools] Erro na consulta de ranking:", error);
      return `Erro ao consultar dados: ${error.message}`;
    }

    if (!data || data.length === 0) {
      const periodInfo = params.start_date || params.end_date 
        ? ` para o período${params.start_date ? ` a partir de ${params.start_date}` : ''}${params.end_date ? ` até ${params.end_date}` : ''}`
        : '';
      return `Nenhum dado de vendas encontrado${periodInfo}.`;
    }

    // Determina qual campo agrupar
    const entityFieldMap: Record<string, string> = {
      'product': 'product_name',
      'seller': 'seller_name',
      'customer': 'customer_name',
      'city': 'city',
      'state': 'state',
      'category': 'category',
      'channel': 'channel'
    };
    
    const groupField = entityFieldMap[params.entity];
    const limit = Math.min(params.limit || 10, 50);

    // Se agrupando por período, usar lógica especial
    if (params.group_by_period) {
      return executeGroupedRanking(data, params, groupField, limit);
    }

    // Lógica original para ranking simples
    const entityMap = new Map<string, { 
      faturamento: number; 
      quantidade: number; 
      custo: number;
      pedidos: Set<string>;
    }>();

    for (const row of data) {
      const key = (row as any)[groupField] || 'Não identificado';
      if (key === 'Não identificado' && params.entity !== 'category') continue;
      
      if (!entityMap.has(key)) {
        entityMap.set(key, { faturamento: 0, quantidade: 0, custo: 0, pedidos: new Set() });
      }
      const stats = entityMap.get(key)!;
      stats.faturamento += parseFloat(row.net_value as string) || 0;
      stats.quantidade += parseFloat(row.quantity as string) || 0;
      stats.custo += parseFloat(row.cost_value as string) || 0;
      if (row.order_id) stats.pedidos.add(row.order_id);
    }

    // Converte para array com métricas calculadas
    const entities = Array.from(entityMap.entries()).map(([nome, stats]) => ({
      nome,
      faturamento: stats.faturamento,
      quantidade: stats.quantidade,
      margem: stats.faturamento > 0 ? ((stats.faturamento - stats.custo) / stats.faturamento) * 100 : 0,
      pedidos: stats.pedidos.size || 1
    }));

    // Ordena pela métrica
    const sortFn = (a: any, b: any) => {
      const aVal = a[params.metric === 'margem' ? 'margem' : params.metric];
      const bVal = b[params.metric === 'margem' ? 'margem' : params.metric];
      return params.direction === 'top' ? bVal - aVal : aVal - bVal;
    };
    
    const sorted = entities.sort(sortFn).slice(0, limit);

    if (sorted.length === 0) {
      return `Nenhum ${params.entity} encontrado com dados suficientes.`;
    }

    // Constrói resultado formatado
    const entityNames: Record<string, string> = {
      'product': 'Produto',
      'seller': 'Vendedor',
      'customer': 'Cliente',
      'city': 'Cidade',
      'state': 'Estado',
      'category': 'Categoria',
      'channel': 'Canal'
    };
    
    const metricNames: Record<string, string> = {
      'faturamento': 'faturamento',
      'quantidade': 'quantidade vendida',
      'margem': 'margem percentual',
      'pedidos': 'número de pedidos'
    };

    const directionLabel = params.direction === 'top' ? 'MAIORES' : 'MENORES';
    let result = `📊 RANKING: ${directionLabel} ${entityNames[params.entity].toUpperCase()}S POR ${metricNames[params.metric].toUpperCase()}\n`;
    
    // Adiciona informação de período se filtrado
    if (params.start_date || params.end_date) {
      const periodStr = params.start_date && params.end_date 
        ? `${params.start_date} a ${params.end_date}`
        : params.start_date ? `a partir de ${params.start_date}` : `até ${params.end_date}`;
      result += `📅 Período: ${periodStr}\n`;
    }
    result += '\n';

    sorted.forEach((item, i) => {
      result += `${i + 1}. ${item.nome}:\n`;
      result += `   - Faturamento: R$ ${item.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      result += `   - Quantidade: ${item.quantidade.toLocaleString('pt-BR')} un\n`;
      result += `   - Margem: ${item.margem.toFixed(1)}%\n`;
      result += `   - Pedidos: ${item.pedidos}\n`;
    });

    result += `\n📈 Total de ${entityNames[params.entity].toLowerCase()}s analisados: ${entities.length}`;
    
    return result;

  } catch (error) {
    console.error("[Tools] Erro na execução da consulta de ranking:", error);
    return `Erro ao processar ranking: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
}

/**
 * Extrai o período (mês/trimestre/ano) de uma data.
 */
function extractPeriod(saleDate: string, periodType: 'month' | 'quarter' | 'year'): string {
  if (!saleDate) return 'N/A';
  
  const [year, month] = saleDate.split('-');
  
  switch (periodType) {
    case 'month':
      return `${year}-${month}`;
    case 'quarter':
      const q = Math.ceil(parseInt(month) / 3);
      return `${year}-Q${q}`;
    case 'year':
      return year;
    default:
      return saleDate.substring(0, 7);
  }
}

/**
 * Formata o nome do período para exibição.
 */
function formatPeriodName(period: string, periodType: 'month' | 'quarter' | 'year'): string {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  if (periodType === 'month') {
    const [year, month] = period.split('-');
    const monthIdx = parseInt(month) - 1;
    return `${monthNames[monthIdx]}/${year}`;
  }
  if (periodType === 'quarter') {
    return period.replace('-', ' ');
  }
  return period;
}

/**
 * Executa ranking agrupado por período (mês/trimestre/ano).
 */
function executeGroupedRanking(
  data: any[], 
  params: RankingParams, 
  groupField: string, 
  limit: number
): string {
  const periodType = params.group_by_period!;
  
  // Agrupa dados por período E entidade
  const periodEntityMap = new Map<string, Map<string, { 
    faturamento: number; 
    quantidade: number; 
    custo: number;
    pedidos: Set<string>;
  }>>();

  for (const row of data) {
    const entityKey = (row as any)[groupField] || 'Não identificado';
    if (entityKey === 'Não identificado' && params.entity !== 'category') continue;
    
    const period = extractPeriod(row.sale_date, periodType);
    if (period === 'N/A') continue;
    
    if (!periodEntityMap.has(period)) {
      periodEntityMap.set(period, new Map());
    }
    const entityMap = periodEntityMap.get(period)!;
    
    if (!entityMap.has(entityKey)) {
      entityMap.set(entityKey, { faturamento: 0, quantidade: 0, custo: 0, pedidos: new Set() });
    }
    const stats = entityMap.get(entityKey)!;
    stats.faturamento += parseFloat(row.net_value as string) || 0;
    stats.quantidade += parseFloat(row.quantity as string) || 0;
    stats.custo += parseFloat(row.cost_value as string) || 0;
    if (row.order_id) stats.pedidos.add(row.order_id);
  }

  // Ordena períodos cronologicamente
  const sortedPeriods = Array.from(periodEntityMap.keys()).sort();
  
  if (sortedPeriods.length === 0) {
    return "Nenhum dado encontrado para agrupar por período.";
  }

  const entityNames: Record<string, string> = {
    'product': 'Produto',
    'seller': 'Vendedor',
    'customer': 'Cliente',
    'city': 'Cidade',
    'state': 'Estado',
    'category': 'Categoria',
    'channel': 'Canal'
  };
  
  const metricNames: Record<string, string> = {
    'faturamento': 'faturamento',
    'quantidade': 'quantidade',
    'margem': 'margem',
    'pedidos': 'pedidos'
  };
  
  const periodTypeNames: Record<string, string> = {
    'month': 'MÊS',
    'quarter': 'TRIMESTRE',
    'year': 'ANO'
  };

  const directionLabel = params.direction === 'top' ? 'MAIORES' : 'MENORES';
  let result = `📊 RANKING: ${directionLabel} ${entityNames[params.entity].toUpperCase()}S POR ${periodTypeNames[periodType]}\n`;
  result += `📈 Métrica: ${metricNames[params.metric]}\n\n`;

  for (const period of sortedPeriods) {
    const entityMap = periodEntityMap.get(period)!;
    
    // Converte para array com métricas
    const entities = Array.from(entityMap.entries()).map(([nome, stats]) => ({
      nome,
      faturamento: stats.faturamento,
      quantidade: stats.quantidade,
      margem: stats.faturamento > 0 ? ((stats.faturamento - stats.custo) / stats.faturamento) * 100 : 0,
      pedidos: stats.pedidos.size || 1
    }));

    // Ordena pela métrica
    const sortFn = (a: any, b: any) => {
      const aVal = a[params.metric === 'margem' ? 'margem' : params.metric];
      const bVal = b[params.metric === 'margem' ? 'margem' : params.metric];
      return params.direction === 'top' ? bVal - aVal : aVal - bVal;
    };
    
    const sorted = entities.sort(sortFn).slice(0, limit);
    
    if (sorted.length === 0) continue;

    result += `📅 ${formatPeriodName(period, periodType)}:\n`;
    
    sorted.forEach((item, i) => {
      const metricValue = params.metric === 'faturamento' 
        ? `R$ ${item.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : params.metric === 'quantidade'
        ? `${item.quantidade.toLocaleString('pt-BR')} un`
        : params.metric === 'margem'
        ? `${item.margem.toFixed(1)}%`
        : `${item.pedidos} pedidos`;
        
      result += `   ${i + 1}. ${item.nome}: ${metricValue}\n`;
    });
    result += '\n';
  }

  result += `📊 Total de períodos analisados: ${sortedPeriods.length}`;
  
  return result;
}

/**
 * Executa comparação entre dois períodos para uma entidade específica.
 * Calcula variação percentual e gera insights sobre crescimento/queda.
 */
export async function executeComparePeriods(
  serviceClient: SupabaseClient,
  tenantId: string,
  activeImportIds: string[],
  params: ComparePeriodParams
): Promise<string> {
  console.log(`[Tools] Executando comparação de períodos:`, params);
  
  if (activeImportIds.length === 0) {
    return "Nenhum dado de vendas disponível. É necessário importar uma planilha de vendas primeiro.";
  }

  try {
    const entityFieldMap: Record<string, string> = {
      'product': 'product_name',
      'seller': 'seller_name',
      'customer': 'customer_name',
      'city': 'city',
      'state': 'state',
      'category': 'category',
      'channel': 'channel'
    };
    
    const groupField = entityFieldMap[params.entity];
    const limit = Math.min(params.limit || 10, 30);
    const metric = params.metric || 'faturamento';

    // Busca dados do período 1
    const { data: data1, error: err1 } = await serviceClient
      .from("sales_lines")
      .select("product_name, seller_name, customer_name, city, state, channel, category, quantity, gross_value, net_value, cost_value")
      .eq("tenant_id", tenantId)
      .in("import_run_id", activeImportIds)
      .gte("sale_date", params.period_1_start)
      .lte("sale_date", params.period_1_end)
      .limit(10000);

    if (err1) {
      console.error("[Tools] Erro na consulta período 1:", err1);
      return `Erro ao consultar período 1: ${err1.message}`;
    }

    // Busca dados do período 2
    const { data: data2, error: err2 } = await serviceClient
      .from("sales_lines")
      .select("product_name, seller_name, customer_name, city, state, channel, category, quantity, gross_value, net_value, cost_value")
      .eq("tenant_id", tenantId)
      .in("import_run_id", activeImportIds)
      .gte("sale_date", params.period_2_start)
      .lte("sale_date", params.period_2_end)
      .limit(10000);

    if (err2) {
      console.error("[Tools] Erro na consulta período 2:", err2);
      return `Erro ao consultar período 2: ${err2.message}`;
    }

    if ((!data1 || data1.length === 0) && (!data2 || data2.length === 0)) {
      return `Nenhum dado encontrado em ambos os períodos (${params.period_1_start} a ${params.period_1_end} e ${params.period_2_start} a ${params.period_2_end}).`;
    }

    // Agrega dados por entidade para cada período
    const aggregateByEntity = (data: any[]) => {
      const map = new Map<string, { faturamento: number; quantidade: number; custo: number }>();
      for (const row of data) {
        const key = (row as any)[groupField] || 'Não identificado';
        if (key === 'Não identificado') continue;
        
        if (!map.has(key)) {
          map.set(key, { faturamento: 0, quantidade: 0, custo: 0 });
        }
        const stats = map.get(key)!;
        stats.faturamento += parseFloat(row.net_value as string) || 0;
        stats.quantidade += parseFloat(row.quantity as string) || 0;
        stats.custo += parseFloat(row.cost_value as string) || 0;
      }
      return map;
    };

    const period1Map = aggregateByEntity(data1 || []);
    const period2Map = aggregateByEntity(data2 || []);

    // Combina entidades de ambos os períodos
    const allEntities = new Set([...period1Map.keys(), ...period2Map.keys()]);
    
    const comparison: Array<{
      nome: string;
      p1_valor: number;
      p2_valor: number;
      variacao: number;
      variacaoPct: number;
    }> = [];

    for (const entity of allEntities) {
      const p1 = period1Map.get(entity) || { faturamento: 0, quantidade: 0, custo: 0 };
      const p2 = period2Map.get(entity) || { faturamento: 0, quantidade: 0, custo: 0 };
      
      let p1_valor: number, p2_valor: number;
      
      if (metric === 'faturamento') {
        p1_valor = p1.faturamento;
        p2_valor = p2.faturamento;
      } else if (metric === 'quantidade') {
        p1_valor = p1.quantidade;
        p2_valor = p2.quantidade;
      } else { // margem
        p1_valor = p1.faturamento > 0 ? ((p1.faturamento - p1.custo) / p1.faturamento) * 100 : 0;
        p2_valor = p2.faturamento > 0 ? ((p2.faturamento - p2.custo) / p2.faturamento) * 100 : 0;
      }
      
      const variacao = p2_valor - p1_valor;
      const variacaoPct = p1_valor > 0 ? ((p2_valor - p1_valor) / p1_valor) * 100 : (p2_valor > 0 ? 100 : 0);
      
      comparison.push({ nome: entity, p1_valor, p2_valor, variacao, variacaoPct });
    }

    // Ordena por variação percentual (maiores crescimentos primeiro)
    comparison.sort((a, b) => b.variacaoPct - a.variacaoPct);
    const top = comparison.slice(0, limit);

    if (top.length === 0) {
      return `Nenhuma entidade encontrada para comparar nos períodos especificados.`;
    }

    // Calcula totais
    const totalP1 = comparison.reduce((sum, c) => sum + c.p1_valor, 0);
    const totalP2 = comparison.reduce((sum, c) => sum + c.p2_valor, 0);
    const totalVariacaoPct = totalP1 > 0 ? ((totalP2 - totalP1) / totalP1) * 100 : 0;

    // Formata nome do período para exibição
    const formatPeriod = (start: string, end: string) => {
      const startMonth = parseInt(start.split('-')[1]);
      const endMonth = parseInt(end.split('-')[1]);
      const year = start.split('-')[0];
      
      // Detecta trimestres
      if (startMonth === 1 && endMonth === 3) return `Q1 ${year}`;
      if (startMonth === 4 && endMonth === 6) return `Q2 ${year}`;
      if (startMonth === 7 && endMonth === 9) return `Q3 ${year}`;
      if (startMonth === 10 && endMonth === 12) return `Q4 ${year}`;
      
      // Detecta mês único
      if (startMonth === endMonth) {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthNames[startMonth - 1]}/${year}`;
      }
      
      return `${start} a ${end}`;
    };

    const p1Label = formatPeriod(params.period_1_start, params.period_1_end);
    const p2Label = formatPeriod(params.period_2_start, params.period_2_end);

    const entityNames: Record<string, string> = {
      'product': 'PRODUTOS',
      'seller': 'VENDEDORES',
      'customer': 'CLIENTES',
      'city': 'CIDADES',
      'state': 'ESTADOS',
      'category': 'CATEGORIAS',
      'channel': 'CANAIS'
    };
    
    const metricLabels: Record<string, string> = {
      'faturamento': 'FATURAMENTO',
      'quantidade': 'QUANTIDADE',
      'margem': 'MARGEM'
    };

    let result = `📊 COMPARATIVO: ${entityNames[params.entity]} - ${metricLabels[metric]}\n`;
    result += `📅 ${p1Label} vs ${p2Label}\n\n`;

    // Tabela de comparação
    result += `| ${params.entity === 'product' ? 'Produto' : params.entity === 'seller' ? 'Vendedor' : params.entity === 'customer' ? 'Cliente' : params.entity.charAt(0).toUpperCase() + params.entity.slice(1)} | ${p1Label} | ${p2Label} | Variação |\n`;
    result += `|---------|---------|---------|----------|\n`;

    for (const item of top) {
      const formatValue = (val: number) => {
        if (metric === 'faturamento') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        if (metric === 'quantidade') return `${val.toLocaleString('pt-BR')} un`;
        return `${val.toFixed(1)}%`;
      };
      
      const varSymbol = item.variacaoPct >= 0 ? '+' : '';
      result += `| ${item.nome.substring(0, 20)} | ${formatValue(item.p1_valor)} | ${formatValue(item.p2_valor)} | ${varSymbol}${item.variacaoPct.toFixed(1)}% |\n`;
    }

    result += `\n📈 RESUMO GERAL:\n`;
    if (metric === 'faturamento') {
      result += `- Total ${p1Label}: R$ ${totalP1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      result += `- Total ${p2Label}: R$ ${totalP2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    } else if (metric === 'quantidade') {
      result += `- Total ${p1Label}: ${totalP1.toLocaleString('pt-BR')} un\n`;
      result += `- Total ${p2Label}: ${totalP2.toLocaleString('pt-BR')} un\n`;
    }
    result += `- Variação: ${totalVariacaoPct >= 0 ? '+' : ''}${totalVariacaoPct.toFixed(1)}%\n`;

    // Insights
    const cresceram = comparison.filter(c => c.variacaoPct > 0).length;
    const cairam = comparison.filter(c => c.variacaoPct < 0).length;
    const novos = comparison.filter(c => c.p1_valor === 0 && c.p2_valor > 0).length;
    const perdidos = comparison.filter(c => c.p1_valor > 0 && c.p2_valor === 0).length;
    
    const maiorCrescimento = comparison.filter(c => c.p1_valor > 0).sort((a, b) => b.variacaoPct - a.variacaoPct)[0];
    const maiorQueda = comparison.filter(c => c.p1_valor > 0).sort((a, b) => a.variacaoPct - b.variacaoPct)[0];

    result += `\n✨ INSIGHTS:\n`;
    result += `- ${cresceram} de ${comparison.length} ${params.entity === 'product' ? 'produtos' : params.entity === 'seller' ? 'vendedores' : 'itens'} cresceram\n`;
    if (novos > 0) result += `- ${novos} ${novos === 1 ? 'novo' : 'novos'} no período 2\n`;
    if (perdidos > 0) result += `- ${perdidos} ${perdidos === 1 ? 'ausente' : 'ausentes'} no período 2\n`;
    if (maiorCrescimento && maiorCrescimento.variacaoPct > 0) {
      result += `- Maior crescimento: ${maiorCrescimento.nome} (+${maiorCrescimento.variacaoPct.toFixed(1)}%)\n`;
    }
    if (maiorQueda && maiorQueda.variacaoPct < 0) {
      result += `- Maior queda: ${maiorQueda.nome} (${maiorQueda.variacaoPct.toFixed(1)}%)\n`;
    }

    return result;

  } catch (error) {
    console.error("[Tools] Erro na comparação de períodos:", error);
    return `Erro ao processar comparação: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
}

// ============================================================================
// EXECUTOR DE ANÁLISE DE TENDÊNCIAS
// ============================================================================

/**
 * Calcula regressão linear simples para determinar tendência.
 * 
 * @param data - Array de valores numéricos
 * @returns Slope (inclinação) e R² (coeficiente de determinação)
 */
function calculateLinearRegression(data: number[]): { slope: number; r2: number; avgGrowth: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, r2: 0, avgGrowth: 0 };
  
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  
  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (data[i] - yMean);
    ssXX += (i - xMean) ** 2;
    ssYY += (data[i] - yMean) ** 2;
  }
  
  const slope = ssXX > 0 ? ssXY / ssXX : 0;
  const r2 = ssYY > 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;
  
  // Calcula crescimento médio período a período
  let totalGrowth = 0;
  let growthPeriods = 0;
  for (let i = 1; i < n; i++) {
    if (data[i - 1] > 0) {
      totalGrowth += ((data[i] - data[i - 1]) / data[i - 1]) * 100;
      growthPeriods++;
    }
  }
  const avgGrowth = growthPeriods > 0 ? totalGrowth / growthPeriods : 0;
  
  return { slope, r2, avgGrowth };
}

/**
 * Conta períodos consecutivos na mesma direção (crescimento ou queda).
 */
function countConsecutivePeriods(data: number[]): number {
  if (data.length < 2) return 0;
  
  let consecutive = 1;
  const lastDir = data[data.length - 1] > data[data.length - 2] ? 1 : -1;
  
  for (let i = data.length - 2; i > 0; i--) {
    const dir = data[i] > data[i - 1] ? 1 : -1;
    if (dir === lastDir) {
      consecutive++;
    } else {
      break;
    }
  }
  
  return consecutive;
}

/**
 * Executa análise de tendências para identificar padrões de crescimento/queda.
 * 
 * @param serviceClient - Cliente Supabase com service role
 * @param tenantId - ID do tenant para validação de segurança
 * @param activeImportIds - IDs de importações ativas
 * @param params - Parâmetros da análise de tendência
 * @returns Resultado formatado em texto
 */
export async function executeTrendAnalysis(
  serviceClient: SupabaseClient,
  tenantId: string,
  activeImportIds: string[],
  params: TrendAnalysisParams
): Promise<string> {
  console.log(`[Tools] Executando análise de tendências:`, params);
  
  if (activeImportIds.length === 0) {
    return "Nenhum dado de vendas disponível. É necessário importar uma planilha de vendas primeiro.";
  }

  try {
    // Busca todos os dados
    const { data, error } = await serviceClient
      .from("sales_lines")
      .select("product_name, seller_name, customer_name, city, state, channel, category, quantity, gross_value, net_value, cost_value, sale_date")
      .eq("tenant_id", tenantId)
      .in("import_run_id", activeImportIds)
      .limit(50000);

    if (error) {
      console.error("[Tools] Erro na consulta de tendências:", error);
      return `Erro ao consultar dados: ${error.message}`;
    }

    if (!data || data.length === 0) {
      return "Nenhum dado de vendas encontrado para análise de tendências.";
    }

    const periodType = params.period_type || 'month';
    const minPeriods = params.min_periods || 3;
    const metric = params.metric || 'faturamento';
    const trendType = params.trend_type || 'all';
    const limit = Math.min(params.limit || 10, 30);

    // Mapa de entidades
    const entityFieldMap: Record<string, string> = {
      'product': 'product_name',
      'seller': 'seller_name',
      'customer': 'customer_name',
      'city': 'city',
      'state': 'state',
      'category': 'category',
      'channel': 'channel'
    };
    
    const groupField = entityFieldMap[params.entity];

    // Agrupa dados por entidade e período
    const entityPeriodMap = new Map<string, Map<string, { faturamento: number; quantidade: number; custo: number }>>();
    
    for (const row of data) {
      const entityName = (row as any)[groupField];
      if (!entityName) continue;
      
      // Determina o período
      let period: string;
      if (periodType === 'quarter') {
        const date = new Date(row.sale_date as string);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        period = `${date.getFullYear()}-Q${quarter}`;
      } else {
        period = (row.sale_date as string).substring(0, 7); // YYYY-MM
      }
      
      if (!entityPeriodMap.has(entityName)) {
        entityPeriodMap.set(entityName, new Map());
      }
      
      const periodMap = entityPeriodMap.get(entityName)!;
      if (!periodMap.has(period)) {
        periodMap.set(period, { faturamento: 0, quantidade: 0, custo: 0 });
      }
      
      const stats = periodMap.get(period)!;
      stats.faturamento += parseFloat(row.net_value as string) || 0;
      stats.quantidade += parseFloat(row.quantity as string) || 0;
      stats.custo += parseFloat(row.cost_value as string) || 0;
    }

    // Analisa tendências para cada entidade
    const trendResults: TrendResult[] = [];
    
    for (const [entityName, periodMap] of entityPeriodMap.entries()) {
      // Ordena períodos e filtra mínimo
      const sortedPeriods = Array.from(periodMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));
      
      if (sortedPeriods.length < minPeriods) continue;
      
      // Extrai valores da métrica
      const values: number[] = sortedPeriods.map(([_, stats]) => {
        if (metric === 'faturamento') return stats.faturamento;
        if (metric === 'quantidade') return stats.quantidade;
        if (metric === 'margem') {
          return stats.faturamento > 0 ? ((stats.faturamento - stats.custo) / stats.faturamento) * 100 : 0;
        }
        return stats.faturamento;
      });
      
      // Calcula regressão
      const { slope, r2, avgGrowth } = calculateLinearRegression(values);
      
      // Determina tendência baseado no slope relativo à média
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      const slopePercent = avgValue > 0 ? (slope / avgValue) * 100 : 0;
      
      let trend: 'growth' | 'decline' | 'stable';
      if (slopePercent > 3) {
        trend = 'growth';
      } else if (slopePercent < -3) {
        trend = 'decline';
      } else {
        trend = 'stable';
      }
      
      // Calcula variação total
      const totalChange = values[0] > 0 
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100 
        : 0;
      
      // Conta períodos consecutivos na mesma direção
      const consecutivePeriods = countConsecutivePeriods(values);
      
      trendResults.push({
        name: entityName,
        trend,
        avg_growth_rate: avgGrowth,
        consistency: r2,
        periods_analyzed: sortedPeriods.length,
        total_change: totalChange,
        consecutive_periods: consecutivePeriods,
        data_points: sortedPeriods.map(([period, stats]) => ({
          period,
          value: metric === 'faturamento' ? stats.faturamento : 
                 metric === 'quantidade' ? stats.quantidade :
                 (stats.faturamento > 0 ? ((stats.faturamento - stats.custo) / stats.faturamento) * 100 : 0)
        }))
      });
    }

    // Filtra por tipo de tendência
    let filtered = trendResults;
    if (trendType !== 'all') {
      filtered = trendResults.filter(r => r.trend === trendType);
    }

    // Ordena por taxa de crescimento ou queda
    if (trendType === 'growth') {
      filtered.sort((a, b) => b.avg_growth_rate - a.avg_growth_rate);
    } else if (trendType === 'decline') {
      filtered.sort((a, b) => a.avg_growth_rate - b.avg_growth_rate);
    } else {
      // Para 'all' ou 'stable', ordena pelo valor absoluto do crescimento
      filtered.sort((a, b) => Math.abs(b.avg_growth_rate) - Math.abs(a.avg_growth_rate));
    }

    const top = filtered.slice(0, limit);

    if (top.length === 0) {
      const trendLabels: Record<string, string> = {
        'growth': 'em crescimento',
        'decline': 'em queda',
        'stable': 'estáveis',
        'all': ''
      };
      return `Nenhum ${params.entity} encontrado ${trendLabels[trendType]} com dados suficientes (mínimo ${minPeriods} períodos).`;
    }

    // Formata resultado
    const entityNames: Record<string, string> = {
      'product': 'PRODUTOS',
      'seller': 'VENDEDORES',
      'customer': 'CLIENTES',
      'city': 'CIDADES',
      'state': 'ESTADOS',
      'category': 'CATEGORIAS',
      'channel': 'CANAIS'
    };
    
    const trendLabels: Record<string, string> = {
      'growth': 'EM CRESCIMENTO',
      'decline': 'EM QUEDA',
      'stable': 'ESTÁVEIS',
      'all': 'ANÁLISE DE TENDÊNCIAS'
    };
    
    const metricLabels: Record<string, string> = {
      'faturamento': 'Faturamento',
      'quantidade': 'Quantidade',
      'margem': 'Margem'
    };
    
    const periodLabels: Record<string, string> = {
      'month': 'mensal',
      'quarter': 'trimestral'
    };

    let result = `📊 ${entityNames[params.entity]} ${trendLabels[trendType]}\n`;
    result += `📏 Métrica: ${metricLabels[metric]} | Análise ${periodLabels[periodType]}\n\n`;

    if (trendType === 'all') {
      // Agrupa por tipo de tendência
      const growth = top.filter(t => t.trend === 'growth');
      const decline = top.filter(t => t.trend === 'decline');
      const stable = top.filter(t => t.trend === 'stable');

      if (growth.length > 0) {
        result += `📈 EM CRESCIMENTO (${growth.length}):\n`;
        for (const item of growth.slice(0, 5)) {
          const consistLabel = item.consistency > 0.7 ? 'alta' : item.consistency > 0.4 ? 'média' : 'baixa';
          result += `- ${item.name}: ${item.avg_growth_rate >= 0 ? '+' : ''}${item.avg_growth_rate.toFixed(1)}%/${periodType === 'month' ? 'mês' : 'trim'} (consistência ${consistLabel})\n`;
        }
        result += '\n';
      }

      if (decline.length > 0) {
        result += `📉 EM QUEDA (${decline.length}):\n`;
        for (const item of decline.slice(0, 5)) {
          const consistLabel = item.consistency > 0.7 ? 'alta' : item.consistency > 0.4 ? 'média' : 'baixa';
          result += `- ${item.name}: ${item.avg_growth_rate.toFixed(1)}%/${periodType === 'month' ? 'mês' : 'trim'} (consistência ${consistLabel})\n`;
        }
        result += '\n';
      }

      if (stable.length > 0) {
        result += `➡️ ESTÁVEIS (${stable.length}):\n`;
        for (const item of stable.slice(0, 3)) {
          result += `- ${item.name}: ${item.avg_growth_rate >= 0 ? '+' : ''}${item.avg_growth_rate.toFixed(1)}%/${periodType === 'month' ? 'mês' : 'trim'}\n`;
        }
        result += '\n';
      }
    } else {
      // Tabela detalhada para tipo específico
      result += `| ${params.entity === 'product' ? 'Produto' : params.entity === 'seller' ? 'Vendedor' : 'Nome'} | Tendência | Taxa Média | Consistência | Períodos |\n`;
      result += `|---------|-----------|------------|--------------|----------|\n`;

      for (const item of top) {
        const trendIcon = item.trend === 'growth' ? '↑' : item.trend === 'decline' ? '↓' : '→';
        const trendLabel = item.trend === 'growth' ? 'Crescimento' : item.trend === 'decline' ? 'Queda' : 'Estável';
        const consistLabel = item.consistency > 0.7 ? 'Alta' : item.consistency > 0.4 ? 'Média' : 'Baixa';
        
        result += `| ${item.name.substring(0, 18)} | ${trendIcon} ${trendLabel} | ${item.avg_growth_rate >= 0 ? '+' : ''}${item.avg_growth_rate.toFixed(1)}%/${periodType === 'month' ? 'mês' : 'trim'} | ${consistLabel} (${(item.consistency * 100).toFixed(0)}%) | ${item.periods_analyzed} |\n`;
      }
    }

    // Insights
    const allGrowth = trendResults.filter(t => t.trend === 'growth');
    const allDecline = trendResults.filter(t => t.trend === 'decline');
    const allStable = trendResults.filter(t => t.trend === 'stable');
    
    result += `\n💡 INSIGHTS:\n`;
    result += `- Total analisado: ${trendResults.length} ${params.entity === 'product' ? 'produtos' : params.entity === 'seller' ? 'vendedores' : 'itens'}\n`;
    result += `- Em crescimento: ${allGrowth.length} (${((allGrowth.length / trendResults.length) * 100).toFixed(0)}%)\n`;
    result += `- Em queda: ${allDecline.length} (${((allDecline.length / trendResults.length) * 100).toFixed(0)}%)\n`;
    result += `- Estáveis: ${allStable.length} (${((allStable.length / trendResults.length) * 100).toFixed(0)}%)\n`;

    // Destaca os extremos
    const bestGrowth = trendResults.filter(t => t.avg_growth_rate > 0).sort((a, b) => b.avg_growth_rate - a.avg_growth_rate)[0];
    const worstDecline = trendResults.filter(t => t.avg_growth_rate < 0).sort((a, b) => a.avg_growth_rate - b.avg_growth_rate)[0];
    const mostConsistent = trendResults.sort((a, b) => b.consistency - a.consistency)[0];

    if (bestGrowth) {
      result += `\n🏆 Maior crescimento: ${bestGrowth.name} (+${bestGrowth.avg_growth_rate.toFixed(1)}%/${periodType === 'month' ? 'mês' : 'trim'})`;
    }
    if (worstDecline) {
      result += `\n⚠️ Maior queda: ${worstDecline.name} (${worstDecline.avg_growth_rate.toFixed(1)}%/${periodType === 'month' ? 'mês' : 'trim'})`;
    }
    if (mostConsistent && mostConsistent.consistency > 0.6) {
      result += `\n📏 Tendência mais previsível: ${mostConsistent.name} (R² = ${(mostConsistent.consistency * 100).toFixed(0)}%)`;
    }

    return result;

  } catch (error) {
    console.error("[Tools] Erro na análise de tendências:", error);
    return `Erro ao processar análise: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
}
