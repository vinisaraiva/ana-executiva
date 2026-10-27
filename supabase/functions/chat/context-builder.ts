/**
 * @fileoverview Construtor de contexto para a IA
 * 
 * Este módulo é responsável por formatar os dados de vendas em um contexto
 * textual que será utilizado pelo modelo de IA para responder perguntas.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { ChatSettings } from "./types.ts";

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Formata um número no padrão brasileiro (separador de milhares e decimais).
 * 
 * @param value - Valor numérico a formatar
 * @param isCurrency - Se true, formata como moeda com 2 casas decimais
 * @returns String formatada no padrão pt-BR
 */
export function formatNumber(value: number | undefined | null, isCurrency = true): string {
  if (value === undefined || value === null) return '0';
  
  if (isCurrency) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString('pt-BR');
}

// ============================================================================
// CONSTRUTOR DE CONTEXTO PRINCIPAL
// ============================================================================

/**
 * Constrói o contexto de dados de vendas para a IA.
 * Formata todas as métricas, rankings e análises em texto estruturado.
 * 
 * @param facts - Dados agregados de vendas
 * @param anomalies - Lista de anomalias detectadas
 * @param settings - Configurações do chat do tenant
 * @param numImports - Número de importações agregadas
 * @param companyName - Nome da empresa (opcional)
 * @param sector - Setor de atuação (opcional)
 * @returns Contexto formatado em texto para o prompt da IA
 */
export function buildAIContext(
  facts: any, 
  anomalies: any[], 
  settings: ChatSettings, 
  numImports: number = 1,
  companyName: string | null = null,
  sector: string | null = null
): string {
  // Caso sem dados
  if (!facts) {
    return "DADOS DISPONÍVEIS:\nNenhum dado de vendas processado ainda. Peça ao usuário para importar um arquivo de vendas.";
  }

  const useIcons = settings.use_icons;
  let context = "=== DADOS DE VENDAS DISPONÍVEIS ===\n\n";
  
  // Contexto da empresa
  if (companyName || sector) {
    context += `${useIcons ? '🏢 ' : ''}EMPRESA: ${companyName || 'Não informado'}`;
    if (sector) {
      context += ` | Setor: ${sector}`;
    }
    context += "\n\n";
  }
  
  // Nota sobre múltiplas importações
  if (numImports > 1) {
    context += `${useIcons ? '📁 ' : ''}NOTA: Dados agregados de ${numImports} importações ativas.\n\n`;
  }

  // KPIs da empresa
  context += buildEmpresaContext(facts, useIcons);

  // Range de datas
  if (facts.date_range) {
    context += `${useIcons ? '📅 ' : ''}PERÍODO DOS DADOS: ${facts.date_range.start} a ${facts.date_range.end}\n\n`;
  }

  // Rankings de vendedores
  context += buildVendedoresContext(facts, useIcons);

  // Rankings de produtos
  context += buildProdutosContext(facts, useIcons);

  // Rankings de clientes
  context += buildClientesContext(facts, useIcons);

  // Análise de canais
  context += buildCanaisContext(facts, useIcons);

  // Análise geográfica
  context += buildGeografiaContext(facts, useIcons);

  // Análise de categorias
  context += buildCategoriasContext(facts, useIcons);

  // Formas de pagamento
  context += buildPagamentosContext(facts, useIcons);

  // Impostos
  context += buildImpostosContext(facts, useIcons);

  // Análise temporal
  context += buildTemporalContext(facts, useIcons);

  // Comparativo YoY
  context += buildYoyContext(facts, useIcons);

  // Análises cross-dimensional
  context += buildCrossDimensionalContext(facts, useIcons);

  // Anomalias
  context += buildAnomaliasContext(anomalies, useIcons);

  return context;
}

// ============================================================================
// FUNÇÕES DE CONTEXTO ESPECÍFICAS
// ============================================================================

/**
 * Constrói contexto de KPIs da empresa.
 */
function buildEmpresaContext(facts: any, useIcons: boolean): string {
  if (!facts.empresa) return '';

  const e = facts.empresa;
  let context = `${useIcons ? '📊 ' : ''}RESUMO GERAL DA EMPRESA:\n`;
  context += `- Faturamento Bruto: R$ ${formatNumber(e.total_faturamento_bruto)}\n`;
  context += `- Faturamento Líquido: R$ ${formatNumber(e.total_faturamento_liquido)}\n`;
  context += `- Custo Total: R$ ${formatNumber(e.total_custo)}\n`;
  context += `- Margem Bruta: R$ ${formatNumber(e.margem_bruta)} (${e.margem_percentual?.toFixed(1) || 0}%)\n`;
  context += `- Ticket Médio: R$ ${formatNumber(e.ticket_medio)}\n`;
  context += `- Total de Pedidos: ${formatNumber(e.total_pedidos, false)}\n`;
  context += `- Total de Itens Vendidos: ${formatNumber(e.total_itens, false)}\n`;
  context += `- Clientes Únicos: ${e.total_clientes_unicos}\n`;
  context += `- Produtos Únicos: ${e.total_produtos_unicos}\n`;
  context += `- Vendedores: ${e.total_vendedores}\n\n`;

  return context;
}

/**
 * Constrói contexto de rankings de vendedores.
 */
function buildVendedoresContext(facts: any, useIcons: boolean): string {
  if (!facts.vendedores?.ranking_faturamento?.length) return '';

  let context = `${useIcons ? '👥 ' : ''}RANKING DE VENDEDORES (por faturamento):\n`;
  facts.vendedores.ranking_faturamento.slice(0, 10).forEach((v: any, i: number) => {
    context += `${i + 1}. ${v.nome}: R$ ${formatNumber(v.faturamento)} | ${v.qtd_pedidos} pedidos | Ticket: R$ ${formatNumber(v.ticket_medio)} | Margem: ${v.margem_percentual?.toFixed(1) || 'N/A'}%\n`;
  });
  context += `Total de vendedores: ${facts.vendedores.total_vendedores}\n\n`;
  
  // Vendedores com menor faturamento
  if (facts.vendedores.bottom_20_faturamento?.length > 0) {
    context += `${useIcons ? '📉 ' : ''}VENDEDORES COM MENOR FATURAMENTO:\n`;
    facts.vendedores.bottom_20_faturamento.slice(0, 10).forEach((v: any, i: number) => {
      context += `${i + 1}. ${v.nome}: R$ ${formatNumber(v.faturamento)} | Margem: ${v.margem_percentual?.toFixed(1) || 'N/A'}%\n`;
    });
    context += "\n";
  }

  return context;
}

/**
 * Constrói contexto de rankings de produtos.
 */
function buildProdutosContext(facts: any, useIcons: boolean): string {
  if (!facts.produtos) return '';

  let context = '';
  const topProdutos = facts.produtos.top_20_faturamento || facts.produtos.top_10_faturamento;
  
  if (topProdutos?.length > 0) {
    context += `${useIcons ? '📦 ' : ''}TOP 20 PRODUTOS (por faturamento):\n`;
    topProdutos.forEach((p: any, i: number) => {
      context += `${i + 1}. ${p.nome}: R$ ${formatNumber(p.faturamento)} | Qtd: ${formatNumber(p.quantidade, false)} | Margem: ${p.margem_percentual?.toFixed(1) || 'N/A'}%\n`;
    });
    context += "\n";
  }

  // Produtos com menor faturamento
  if (facts.produtos.bottom_20_faturamento?.length > 0) {
    context += `${useIcons ? '📉 ' : ''}PRODUTOS COM MENOR FATURAMENTO:\n`;
    facts.produtos.bottom_20_faturamento.slice(0, 10).forEach((p: any, i: number) => {
      context += `${i + 1}. ${p.nome}: R$ ${formatNumber(p.faturamento)} | Qtd: ${formatNumber(p.quantidade, false)}\n`;
    });
    context += "\n";
  }

  // Curva ABC
  if (facts.produtos.curva_abc) {
    const abc = facts.produtos.curva_abc;
    context += `${useIcons ? '📊 ' : ''}CURVA ABC DE PRODUTOS:\n`;
    context += `- Curva A: ${abc.curva_a.qtd} produtos = ${abc.curva_a.percentual_faturamento}% do faturamento\n`;
    context += `- Curva B: ${abc.curva_b.qtd} produtos = ${abc.curva_b.percentual_faturamento}% do faturamento\n`;
    context += `- Curva C: ${abc.curva_c.qtd} produtos = ${abc.curva_c.percentual_faturamento}% do faturamento\n\n`;
  }

  // Produtos com menor margem
  const bottomMargem = facts.produtos.bottom_20_margem || facts.produtos.bottom_10_margem;
  if (bottomMargem?.length > 0) {
    context += `${useIcons ? '⚠️ ' : ''}PRODUTOS COM MENOR MARGEM:\n`;
    bottomMargem.slice(0, 10).forEach((p: any, i: number) => {
      context += `${i + 1}. ${p.nome}: Margem ${p.margem_percentual?.toFixed(1) || 0}%\n`;
    });
    context += "\n";
  }

  return context;
}

/**
 * Constrói contexto de rankings de clientes.
 */
function buildClientesContext(facts: any, useIcons: boolean): string {
  const topClientes = facts.clientes?.top_20_faturamento || facts.clientes?.top_10_faturamento;
  if (!facts.clientes || !topClientes?.length) return '';

  let context = `${useIcons ? '🏆 ' : ''}TOP 20 CLIENTES (por faturamento):\n`;
  topClientes.forEach((c: any, i: number) => {
    context += `${i + 1}. ${c.nome}: R$ ${formatNumber(c.faturamento)} | ${c.qtd_pedidos} pedidos | Ticket: R$ ${formatNumber(c.ticket_medio)}\n`;
  });
  context += `\nClientes recorrentes: ${facts.clientes.clientes_recorrentes} | Novos: ${facts.clientes.clientes_novos}\n\n`;
  
  // Clientes com menor faturamento
  if (facts.clientes.bottom_20_faturamento?.length > 0) {
    context += `${useIcons ? '📉 ' : ''}CLIENTES COM MENOR FATURAMENTO:\n`;
    facts.clientes.bottom_20_faturamento.slice(0, 10).forEach((c: any, i: number) => {
      context += `${i + 1}. ${c.nome}: R$ ${formatNumber(c.faturamento)} | ${c.qtd_pedidos} pedidos\n`;
    });
    context += "\n";
  }

  return context;
}

/**
 * Constrói contexto de análise de canais.
 */
function buildCanaisContext(facts: any, useIcons: boolean): string {
  if (!facts.canais?.length) return '';

  let context = `${useIcons ? '📍 ' : ''}DESEMPENHO POR CANAL:\n`;
  facts.canais.forEach((c: any) => {
    context += `- ${c.nome}: R$ ${formatNumber(c.faturamento)} (${c.percentual}%) | ${c.qtd_pedidos} pedidos | Ticket: R$ ${formatNumber(c.ticket_medio)}\n`;
  });
  context += "\n";

  return context;
}

/**
 * Constrói contexto de análise geográfica (cidades e estados).
 */
function buildGeografiaContext(facts: any, useIcons: boolean): string {
  let context = '';

  // Cidades
  const topCidades = facts.cidades?.top_20 || facts.cidades?.top_10;
  if (facts.cidades && topCidades?.length > 0) {
    context += `${useIcons ? '🏙️ ' : ''}TOP 20 CIDADES (por faturamento):\n`;
    topCidades.forEach((c: any, i: number) => {
      context += `${i + 1}. ${c.nome}: R$ ${formatNumber(c.faturamento)} (${c.percentual}%) | ${c.qtd_pedidos} pedidos\n`;
    });
    context += `Total de cidades: ${facts.cidades.total_cidades}\n\n`;
    
    // Cidades com menor faturamento
    if (facts.cidades.bottom_20?.length > 0) {
      context += `${useIcons ? '📉 ' : ''}CIDADES COM MENOR FATURAMENTO:\n`;
      facts.cidades.bottom_20.slice(0, 10).forEach((c: any, i: number) => {
        context += `${i + 1}. ${c.nome}: R$ ${formatNumber(c.faturamento)} | ${c.qtd_pedidos} pedidos\n`;
      });
      context += "\n";
    }
  }

  // Estados/UF
  if (facts.estados?.length > 0) {
    context += `${useIcons ? '🗺️ ' : ''}VENDAS POR ESTADO/UF:\n`;
    facts.estados.forEach((e: any) => {
      context += `- ${e.nome}: R$ ${formatNumber(e.faturamento)} (${e.percentual}%) | ${e.qtd_pedidos} pedidos\n`;
    });
    context += "\n";
  }

  return context;
}

/**
 * Constrói contexto de análise de categorias.
 */
function buildCategoriasContext(facts: any, useIcons: boolean): string {
  if (!facts.categorias?.length) return '';

  let context = `${useIcons ? '📂 ' : ''}VENDAS POR CATEGORIA:\n`;
  facts.categorias.forEach((c: any) => {
    context += `- ${c.nome}: R$ ${formatNumber(c.faturamento)} (${c.percentual}%) | Margem: ${c.margem_percentual?.toFixed(1) || 'N/A'}%\n`;
  });
  context += "\n";

  return context;
}

/**
 * Constrói contexto de formas de pagamento.
 */
function buildPagamentosContext(facts: any, useIcons: boolean): string {
  if (!facts.formas_pagamento?.length) return '';

  let context = `${useIcons ? '💳 ' : ''}FORMAS DE PAGAMENTO:\n`;
  facts.formas_pagamento.forEach((p: any) => {
    context += `- ${p.nome}: R$ ${formatNumber(p.faturamento)} (${p.percentual}%) | ${p.qtd_pedidos} pedidos\n`;
  });
  context += "\n";

  return context;
}

/**
 * Constrói contexto de resumo de impostos.
 */
function buildImpostosContext(facts: any, useIcons: boolean): string {
  if (!facts.impostos?.total_impostos) return '';

  let context = `${useIcons ? '🧾 ' : ''}RESUMO DE IMPOSTOS:\n`;
  context += `- Total de Impostos: R$ ${formatNumber(facts.impostos.total_impostos)}\n`;
  context += `- % sobre Faturamento Bruto: ${facts.impostos.percentual_sobre_bruto?.toFixed(1) || 0}%\n`;
  context += `- Imposto Médio por Venda: R$ ${formatNumber(facts.impostos.imposto_medio_por_venda)}\n\n`;

  return context;
}

/**
 * Constrói contexto de análise temporal.
 */
function buildTemporalContext(facts: any, useIcons: boolean): string {
  if (!facts.temporal) return '';

  let context = '';

  // Evolução mensal
  if (facts.temporal.por_mes?.length > 0) {
    context += `${useIcons ? '📈 ' : ''}EVOLUÇÃO MENSAL:\n`;
    facts.temporal.por_mes.forEach((m: any) => {
      const growth = m.crescimento_mom !== null ? ` (${m.crescimento_mom > 0 ? '+' : ''}${m.crescimento_mom}% vs mês anterior)` : '';
      context += `- ${m.mes}: R$ ${formatNumber(m.faturamento)}${growth}\n`;
    });
    context += "\n";
  }

  // Média por dia da semana
  if (facts.temporal.por_dia_semana?.length > 0) {
    context += `${useIcons ? '📅 ' : ''}MÉDIA POR DIA DA SEMANA:\n`;
    facts.temporal.por_dia_semana.forEach((d: any) => {
      context += `- ${d.dia}: R$ ${formatNumber(d.media_faturamento)}\n`;
    });
    context += "\n";
  }

  // Melhor e pior dia
  if (facts.temporal.melhor_dia) {
    context += `${useIcons ? '🏆 ' : ''}Melhor dia: ${facts.temporal.melhor_dia.data} com R$ ${formatNumber(facts.temporal.melhor_dia.faturamento)}\n`;
  }
  if (facts.temporal.pior_dia) {
    context += `${useIcons ? '📉 ' : ''}Pior dia: ${facts.temporal.pior_dia.data} com R$ ${formatNumber(facts.temporal.pior_dia.faturamento)}\n`;
  }
  if (facts.temporal.media_diaria) {
    context += `${useIcons ? '📊 ' : ''}Média diária: R$ ${formatNumber(facts.temporal.media_diaria)}\n`;
  }
  context += "\n";

  return context;
}

/**
 * Constrói contexto de comparativo ano a ano.
 */
function buildYoyContext(facts: any, useIcons: boolean): string {
  if (!facts.comparativo_yoy?.disponivel) return '';

  const yoy = facts.comparativo_yoy;
  let context = `${useIcons ? '📊 ' : ''}COMPARATIVO ANO A ANO:\n`;
  context += `Empresa: ${yoy.empresa.ano_atual} vs ${yoy.empresa.ano_anterior}\n`;
  context += `- Faturamento atual: R$ ${formatNumber(yoy.empresa.faturamento_atual)}\n`;
  context += `- Faturamento anterior: R$ ${formatNumber(yoy.empresa.faturamento_anterior)}\n`;
  context += `- Variação: ${yoy.empresa.variacao_percentual > 0 ? '+' : ''}${yoy.empresa.variacao_percentual}%\n\n`;

  // Por vendedor
  if (yoy.por_vendedor?.length > 0) {
    context += "Variação por Vendedor (YoY):\n";
    yoy.por_vendedor.slice(0, 5).forEach((v: any) => {
      const varStr = v.variacao !== null ? `${v.variacao > 0 ? '+' : ''}${v.variacao}%` : 'N/A';
      context += `- ${v.nome}: R$ ${formatNumber(v.atual)} (${varStr})\n`;
    });
    context += "\n";
  }

  // Por produto
  if (yoy.por_produto?.length > 0) {
    context += "Variação por Produto (YoY):\n";
    yoy.por_produto.slice(0, 5).forEach((p: any) => {
      const varStr = p.variacao !== null ? `${p.variacao > 0 ? '+' : ''}${p.variacao}%` : 'N/A';
      context += `- ${p.nome}: R$ ${formatNumber(p.atual)} (${varStr})\n`;
    });
    context += "\n";
  }

  return context;
}

/**
 * Constrói contexto de análises cross-dimensional.
 */
function buildCrossDimensionalContext(facts: any, useIcons: boolean): string {
  let context = '';

  // Vendedores por cidade
  if (facts.vendedores_por_cidade) {
    context += `${useIcons ? '🏙️ ' : ''}TOP VENDEDORES POR CIDADE:\n`;
    const cities = Object.entries(facts.vendedores_por_cidade).slice(0, 8);
    for (const [cidade, vendedores] of cities) {
      const top3 = (vendedores as any[]).slice(0, 3);
      if (top3.length > 0) {
        context += `${cidade}: ${top3.map(v => `${v.nome} (R$ ${formatNumber(v.faturamento)})`).join(', ')}\n`;
      }
    }
    context += "\n";
  }

  // Produtos por canal
  if (facts.produtos_por_canal) {
    context += `${useIcons ? '📍 ' : ''}TOP PRODUTOS POR CANAL:\n`;
    for (const [canal, produtos] of Object.entries(facts.produtos_por_canal)) {
      const top3 = (produtos as any[]).slice(0, 3);
      if (top3.length > 0) {
        context += `${canal}: ${top3.map(p => `${p.nome} (R$ ${formatNumber(p.faturamento)})`).join(', ')}\n`;
      }
    }
    context += "\n";
  }

  // Vendedores por produto
  if (facts.vendedores_por_produto) {
    context += `${useIcons ? '📦 ' : ''}QUEM MAIS VENDE CADA PRODUTO:\n`;
    const produtos = Object.entries(facts.vendedores_por_produto).slice(0, 10);
    for (const [produto, vendedores] of produtos) {
      const top = (vendedores as any[])[0];
      if (top) {
        context += `${produto}: ${top.nome} lidera com R$ ${formatNumber(top.faturamento)}\n`;
      }
    }
    context += "\n";
  }

  // Categorias por UF
  if (facts.categorias_por_uf) {
    context += `${useIcons ? '🗺️ ' : ''}CATEGORIAS DOMINANTES POR ESTADO:\n`;
    for (const [uf, categorias] of Object.entries(facts.categorias_por_uf)) {
      const top = (categorias as any[])[0];
      if (top) {
        context += `${uf}: ${top.categoria} lidera (${top.percentual}% do faturamento)\n`;
      }
    }
    context += "\n";
  }

  // Vendedores por mês (tendências)
  if (facts.vendedores_por_mes?.length > 0) {
    context += `${useIcons ? '📊 ' : ''}TENDÊNCIA DE VENDEDORES (Performance ao longo do tempo):\n`;
    
    const topSellers = facts.vendedores_por_mes.slice(0, 10);
    for (const seller of topSellers) {
      const trend = seller.tendencia_geral !== null 
        ? (seller.tendencia_geral > 0 ? `↑${seller.tendencia_geral}%` : `↓${Math.abs(seller.tendencia_geral)}%`)
        : 'estável';
      
      const lastMonths = (seller.meses || []).slice(-3);
      const monthsSummary = lastMonths.map((m: any) => `${m.mes}: R$ ${formatNumber(m.faturamento)}`).join(' | ');
      
      context += `${seller.vendedor} (${trend}): ${monthsSummary}\n`;
    }
    
    // Destaca vendedores em alta e em queda
    const growers = facts.vendedores_por_mes
      .filter((s: any) => s.tendencia_geral !== null && s.tendencia_geral > 20)
      .slice(0, 3);
    
    const decliners = facts.vendedores_por_mes
      .filter((s: any) => s.tendencia_geral !== null && s.tendencia_geral < -20)
      .slice(0, 3);
    
    if (growers.length > 0) {
      context += `\n${useIcons ? '🚀 ' : ''}EM ALTA: ${growers.map((s: any) => `${s.vendedor} (+${s.tendencia_geral}%)`).join(', ')}\n`;
    }
    
    if (decliners.length > 0) {
      context += `${useIcons ? '⚠️ ' : ''}EM QUEDA: ${decliners.map((s: any) => `${s.vendedor} (${s.tendencia_geral}%)`).join(', ')}\n`;
    }
    
    context += "\n";
  }

  return context;
}

/**
 * Constrói contexto de anomalias detectadas.
 */
function buildAnomaliasContext(anomalies: any[], useIcons: boolean): string {
  if (!anomalies?.length) return '';

  let context = `${useIcons ? '⚠️ ' : ''}ALERTAS E ANOMALIAS DETECTADAS:\n`;
  anomalies.forEach((a) => {
    const severity = useIcons 
      ? (a.severity === 'error' ? '🔴' : a.severity === 'warning' ? '🟡' : '🔵')
      : `[${a.severity.toUpperCase()}]`;
    context += `${severity} [${a.code}] ${a.title}\n`;
    if (a.details) {
      if (a.details.drop_percent) {
        context += `   Queda de ${a.details.drop_percent}% - De R$ ${formatNumber(a.details.previous_value)} para R$ ${formatNumber(a.details.current_value)}\n`;
      }
      if (a.details.products) {
        context += `   Produtos afetados: ${a.details.products.slice(0, 3).map((p: any) => p.name).join(', ')}\n`;
      }
      if (a.details.seller) {
        context += `   Vendedor: ${a.details.seller}\n`;
      }
    }
  });
  context += "\n";

  return context;
}
