/**
 * @fileoverview Agregador de dados de múltiplas importações
 * 
 * Este módulo é responsável por consolidar os dados de várias importações
 * ativas em uma única estrutura unificada para análise pela IA.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

// ============================================================================
// FUNÇÃO PRINCIPAL DE AGREGAÇÃO
// ============================================================================

/**
 * Agrega facts de múltiplas importações ativas em uma estrutura consolidada.
 * Combina vendedores, produtos, clientes, canais e análises temporais.
 * 
 * @param allFacts - Array de objetos facts de cada importação
 * @param activeImports - Array de importações ativas com datas
 * @returns Objeto consolidado com todos os dados agregados
 */
export function aggregateMultipleFacts(allFacts: any[], activeImports: any[]): any {
  // Caso sem dados
  if (allFacts.length === 0) return null;
  
  // Caso com apenas uma importação - retorna diretamente
  if (allFacts.length === 1) {
    const result = { ...allFacts[0].facts };
    // Adiciona range de datas das importações
    if (activeImports.length > 0) {
      const startDates = activeImports.map(i => i.detected_start_date).filter(Boolean);
      const endDates = activeImports.map(i => i.detected_end_date).filter(Boolean);
      if (startDates.length > 0) {
        result.date_range = {
          start: startDates.sort()[0],
          end: endDates.sort().reverse()[0]
        };
      }
    }
    return result;
  }

  // Estrutura base para agregação de múltiplas importações
  const aggregated: any = {
    empresa: null,
    vendedores: null,
    produtos: null,
    clientes: null,
    canais: null,
    temporal: null,
    date_range: null,
    comparativo_yoy: null,
    // Análises cross-dimensional
    vendedores_por_cidade: null,
    produtos_por_canal: null,
    vendedores_por_produto: null,
    categorias_por_uf: null,
    vendedores_por_mes: null,
  };

  // Calcula range de datas combinado
  const startDates = activeImports.map(i => i.detected_start_date).filter(Boolean);
  const endDates = activeImports.map(i => i.detected_end_date).filter(Boolean);
  if (startDates.length > 0) {
    aggregated.date_range = {
      start: startDates.sort()[0],
      end: endDates.sort().reverse()[0]
    };
  }

  // Agrega estatísticas da empresa
  aggregated.empresa = mergeEmpresaStats(allFacts);

  // Merge rankings de vendedores
  aggregated.vendedores = mergeVendedoresRankings(allFacts);

  // Merge rankings de produtos
  aggregated.produtos = mergeProdutosRankings(allFacts);

  // Merge rankings de clientes
  aggregated.clientes = mergeClientesRankings(allFacts);

  // Merge dados de canais
  aggregated.canais = mergeCanalData(allFacts);

  // Merge dados temporais
  aggregated.temporal = mergeTemporalData(allFacts, aggregated.empresa);

  // Merge análises cross-dimensional
  mergeCrossDimensionalData(allFacts, aggregated);

  return aggregated;
}

// ============================================================================
// FUNÇÕES DE MERGE - EMPRESA
// ============================================================================

/**
 * Consolida estatísticas da empresa de múltiplas importações.
 */
function mergeEmpresaStats(allFacts: any[]): any {
  const empresaStats = allFacts.map(f => f.facts?.empresa).filter(Boolean);
  if (empresaStats.length === 0) return null;

  const empresa = {
    total_faturamento_bruto: empresaStats.reduce((sum, e) => sum + (e.total_faturamento_bruto || 0), 0),
    total_faturamento_liquido: empresaStats.reduce((sum, e) => sum + (e.total_faturamento_liquido || 0), 0),
    total_custo: empresaStats.reduce((sum, e) => sum + (e.total_custo || 0), 0),
    margem_bruta: empresaStats.reduce((sum, e) => sum + (e.margem_bruta || 0), 0),
    total_pedidos: empresaStats.reduce((sum, e) => sum + (e.total_pedidos || 0), 0),
    total_itens: empresaStats.reduce((sum, e) => sum + (e.total_itens || 0), 0),
    ticket_medio: 0,
    margem_percentual: 0,
    total_clientes_unicos: 0,
    total_produtos_unicos: 0,
    total_vendedores: 0,
  };
  
  // Calcula valores derivados
  if (empresa.total_pedidos > 0) {
    empresa.ticket_medio = empresa.total_faturamento_bruto / empresa.total_pedidos;
  }
  if (empresa.total_faturamento_bruto > 0) {
    empresa.margem_percentual = (empresa.margem_bruta / empresa.total_faturamento_bruto) * 100;
  }
  
  // Pega máximo de contagens únicas (podem se sobrepor entre importações)
  empresa.total_clientes_unicos = Math.max(...empresaStats.map(e => e.total_clientes_unicos || 0));
  empresa.total_produtos_unicos = Math.max(...empresaStats.map(e => e.total_produtos_unicos || 0));
  empresa.total_vendedores = Math.max(...empresaStats.map(e => e.total_vendedores || 0));

  return empresa;
}

// ============================================================================
// FUNÇÕES DE MERGE - VENDEDORES
// ============================================================================

/**
 * Consolida rankings de vendedores de múltiplas importações.
 */
function mergeVendedoresRankings(allFacts: any[]): any {
  const vendedoresMap = new Map<string, any>();
  
  allFacts.forEach(f => {
    const ranking = f.facts?.vendedores?.ranking_faturamento || [];
    ranking.forEach((v: any) => {
      const key = v.nome?.toLowerCase() || '';
      if (vendedoresMap.has(key)) {
        const existing = vendedoresMap.get(key);
        existing.faturamento = (existing.faturamento || 0) + (v.faturamento || 0);
        existing.qtd_pedidos = (existing.qtd_pedidos || 0) + (v.qtd_pedidos || 0);
        existing.custo = (existing.custo || 0) + (v.custo || 0);
      } else {
        vendedoresMap.set(key, { ...v });
      }
    });
  });
  
  const mergedVendedores = Array.from(vendedoresMap.values())
    .map(v => ({
      ...v,
      ticket_medio: v.qtd_pedidos > 0 ? v.faturamento / v.qtd_pedidos : 0,
      margem_percentual: v.faturamento > 0 ? ((v.faturamento - (v.custo || 0)) / v.faturamento) * 100 : null,
    }))
    .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0));
  
  if (mergedVendedores.length === 0) return null;

  return {
    ranking_faturamento: mergedVendedores,
    total_vendedores: mergedVendedores.length,
  };
}

// ============================================================================
// FUNÇÕES DE MERGE - PRODUTOS
// ============================================================================

/**
 * Consolida rankings de produtos de múltiplas importações.
 */
function mergeProdutosRankings(allFacts: any[]): any {
  const produtosMap = new Map<string, any>();
  
  allFacts.forEach(f => {
    const ranking = f.facts?.produtos?.top_20_faturamento || f.facts?.produtos?.top_10_faturamento || [];
    ranking.forEach((p: any) => {
      const key = p.nome?.toLowerCase() || p.sku?.toLowerCase() || '';
      if (produtosMap.has(key)) {
        const existing = produtosMap.get(key);
        existing.faturamento = (existing.faturamento || 0) + (p.faturamento || 0);
        existing.quantidade = (existing.quantidade || 0) + (p.quantidade || 0);
        existing.custo = (existing.custo || 0) + (p.custo || 0);
      } else {
        produtosMap.set(key, { ...p });
      }
    });
  });
  
  const mergedProdutos = Array.from(produtosMap.values())
    .map(p => ({
      ...p,
      margem_percentual: p.faturamento > 0 ? ((p.faturamento - (p.custo || 0)) / p.faturamento) * 100 : null,
    }))
    .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0));
  
  if (mergedProdutos.length === 0) return null;

  return {
    top_20_faturamento: mergedProdutos.slice(0, 20),
    curva_abc: allFacts[0].facts?.produtos?.curva_abc, // Usa curva ABC da primeira importação
    bottom_20_margem: mergedProdutos.sort((a, b) => (a.margem_percentual || 0) - (b.margem_percentual || 0)).slice(0, 20),
  };
}

// ============================================================================
// FUNÇÕES DE MERGE - CLIENTES
// ============================================================================

/**
 * Consolida rankings de clientes de múltiplas importações.
 */
function mergeClientesRankings(allFacts: any[]): any {
  const clientesMap = new Map<string, any>();
  
  allFacts.forEach(f => {
    const ranking = f.facts?.clientes?.top_20_faturamento || f.facts?.clientes?.top_10_faturamento || [];
    ranking.forEach((c: any) => {
      const key = c.nome?.toLowerCase() || '';
      if (clientesMap.has(key)) {
        const existing = clientesMap.get(key);
        existing.faturamento = (existing.faturamento || 0) + (c.faturamento || 0);
        existing.qtd_pedidos = (existing.qtd_pedidos || 0) + (c.qtd_pedidos || 0);
      } else {
        clientesMap.set(key, { ...c });
      }
    });
  });
  
  const mergedClientes = Array.from(clientesMap.values())
    .map(c => ({
      ...c,
      ticket_medio: c.qtd_pedidos > 0 ? c.faturamento / c.qtd_pedidos : 0,
    }))
    .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0));
  
  if (mergedClientes.length === 0) return null;

  // Calcula clientes recorrentes e novos (aproximação)
  const recorrentes = mergedClientes.filter((c: any) => c.qtd_pedidos > 1).length;
  const novos = mergedClientes.length - recorrentes;

  return {
    top_20_faturamento: mergedClientes.slice(0, 20),
    bottom_20_faturamento: mergedClientes.slice(-20).reverse(),
    clientes_recorrentes: recorrentes,
    clientes_novos: novos,
  };
}

// ============================================================================
// FUNÇÕES DE MERGE - CANAIS
// ============================================================================

/**
 * Consolida dados de canais de vendas de múltiplas importações.
 */
function mergeCanalData(allFacts: any[]): any[] | null {
  const canalMap = new Map<string, any>();
  
  allFacts.forEach(f => {
    const canais = f.facts?.canais || [];
    canais.forEach((c: any) => {
      const key = c.nome?.toLowerCase() || '';
      if (canalMap.has(key)) {
        const existing = canalMap.get(key);
        existing.faturamento = (existing.faturamento || 0) + (c.faturamento || 0);
        existing.qtd_pedidos = (existing.qtd_pedidos || 0) + (c.qtd_pedidos || 0);
      } else {
        canalMap.set(key, { ...c });
      }
    });
  });
  
  const mergedCanais = Array.from(canalMap.values())
    .map(c => ({
      ...c,
      ticket_medio: c.qtd_pedidos > 0 ? c.faturamento / c.qtd_pedidos : 0,
    }))
    .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0));
  
  // Recalcula percentuais
  const totalFaturamento = mergedCanais.reduce((sum, c) => sum + (c.faturamento || 0), 0);
  mergedCanais.forEach(c => {
    c.percentual = totalFaturamento > 0 ? Math.round((c.faturamento / totalFaturamento) * 100) : 0;
  });
  
  return mergedCanais.length > 0 ? mergedCanais : null;
}

// ============================================================================
// FUNÇÕES DE MERGE - TEMPORAL
// ============================================================================

/**
 * Consolida dados temporais de múltiplas importações.
 */
function mergeTemporalData(allFacts: any[], empresaStats: any): any {
  const mesMap = new Map<string, any>();
  
  allFacts.forEach(f => {
    const meses = f.facts?.temporal?.por_mes || [];
    meses.forEach((m: any) => {
      if (mesMap.has(m.mes)) {
        const existing = mesMap.get(m.mes);
        existing.faturamento = (existing.faturamento || 0) + (m.faturamento || 0);
        existing.qtd_pedidos = (existing.qtd_pedidos || 0) + (m.qtd_pedidos || 0);
      } else {
        mesMap.set(m.mes, { ...m });
      }
    });
  });
  
  const mergedMeses = Array.from(mesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  
  // Recalcula crescimento mês a mês
  for (let i = 1; i < mergedMeses.length; i++) {
    const prev = mergedMeses[i - 1].faturamento || 0;
    const curr = mergedMeses[i].faturamento || 0;
    mergedMeses[i].crescimento_mom = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
  }
  
  if (mergedMeses.length === 0) return null;

  return {
    por_mes: mergedMeses,
    por_dia_semana: allFacts[0].facts?.temporal?.por_dia_semana,
    melhor_dia: allFacts[0].facts?.temporal?.melhor_dia,
    pior_dia: allFacts[0].facts?.temporal?.pior_dia,
    media_diaria: empresaStats ? empresaStats.total_faturamento_bruto / 30 : null,
  };
}

// ============================================================================
// FUNÇÕES DE MERGE - CROSS-DIMENSIONAL
// ============================================================================

/**
 * Consolida análises cross-dimensional de múltiplas importações.
 * Modifica o objeto aggregated diretamente.
 */
function mergeCrossDimensionalData(allFacts: any[], aggregated: any): void {
  // Merge vendedores por cidade
  const vendedoresCidadeMap = new Map<string, Map<string, any>>();
  allFacts.forEach(f => {
    const data = f.facts?.vendedores_por_cidade;
    if (!data) return;
    for (const [cidade, vendedores] of Object.entries(data)) {
      if (!vendedoresCidadeMap.has(cidade)) {
        vendedoresCidadeMap.set(cidade, new Map());
      }
      const sellerMap = vendedoresCidadeMap.get(cidade)!;
      (vendedores as any[]).forEach((v: any) => {
        const key = v.nome?.toLowerCase();
        if (!key) return;
        if (sellerMap.has(key)) {
          const existing = sellerMap.get(key);
          existing.faturamento = (existing.faturamento || 0) + (v.faturamento || 0);
          existing.qtd_pedidos = (existing.qtd_pedidos || 0) + (v.qtd_pedidos || 0);
          existing.quantidade = (existing.quantidade || 0) + (v.quantidade || 0);
        } else {
          sellerMap.set(key, { ...v });
        }
      });
    }
  });
  
  if (vendedoresCidadeMap.size > 0) {
    aggregated.vendedores_por_cidade = {};
    for (const [cidade, sellers] of vendedoresCidadeMap) {
      aggregated.vendedores_por_cidade[cidade] = Array.from(sellers.values())
        .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0))
        .slice(0, 10);
    }
  }

  // Merge produtos por canal
  const produtosCanalMap = new Map<string, Map<string, any>>();
  allFacts.forEach(f => {
    const data = f.facts?.produtos_por_canal;
    if (!data) return;
    for (const [canal, produtos] of Object.entries(data)) {
      if (!produtosCanalMap.has(canal)) {
        produtosCanalMap.set(canal, new Map());
      }
      const productMap = produtosCanalMap.get(canal)!;
      (produtos as any[]).forEach((p: any) => {
        const key = p.nome?.toLowerCase();
        if (!key) return;
        if (productMap.has(key)) {
          const existing = productMap.get(key);
          existing.faturamento = (existing.faturamento || 0) + (p.faturamento || 0);
          existing.quantidade = (existing.quantidade || 0) + (p.quantidade || 0);
        } else {
          productMap.set(key, { ...p });
        }
      });
    }
  });
  
  if (produtosCanalMap.size > 0) {
    aggregated.produtos_por_canal = {};
    for (const [canal, products] of produtosCanalMap) {
      aggregated.produtos_por_canal[canal] = Array.from(products.values())
        .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0))
        .slice(0, 20);
    }
  }

  // Merge vendedores por produto
  const vendedoresProdutoMap = new Map<string, Map<string, any>>();
  allFacts.forEach(f => {
    const data = f.facts?.vendedores_por_produto;
    if (!data) return;
    for (const [produto, vendedores] of Object.entries(data)) {
      if (!vendedoresProdutoMap.has(produto)) {
        vendedoresProdutoMap.set(produto, new Map());
      }
      const sellerMap = vendedoresProdutoMap.get(produto)!;
      (vendedores as any[]).forEach((v: any) => {
        const key = v.nome?.toLowerCase();
        if (!key) return;
        if (sellerMap.has(key)) {
          const existing = sellerMap.get(key);
          existing.faturamento = (existing.faturamento || 0) + (v.faturamento || 0);
          existing.quantidade = (existing.quantidade || 0) + (v.quantidade || 0);
        } else {
          sellerMap.set(key, { ...v });
        }
      });
    }
  });
  
  if (vendedoresProdutoMap.size > 0) {
    aggregated.vendedores_por_produto = {};
    for (const [produto, sellers] of vendedoresProdutoMap) {
      aggregated.vendedores_por_produto[produto] = Array.from(sellers.values())
        .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0))
        .slice(0, 10);
    }
  }

  // Merge categorias por UF
  const categoriasUfMap = new Map<string, Map<string, any>>();
  allFacts.forEach(f => {
    const data = f.facts?.categorias_por_uf;
    if (!data) return;
    for (const [uf, categorias] of Object.entries(data)) {
      if (!categoriasUfMap.has(uf)) {
        categoriasUfMap.set(uf, new Map());
      }
      const catMap = categoriasUfMap.get(uf)!;
      (categorias as any[]).forEach((c: any) => {
        const key = c.categoria?.toLowerCase();
        if (!key) return;
        if (catMap.has(key)) {
          const existing = catMap.get(key);
          existing.faturamento = (existing.faturamento || 0) + (c.faturamento || 0);
          existing.quantidade = (existing.quantidade || 0) + (c.quantidade || 0);
        } else {
          catMap.set(key, { ...c });
        }
      });
    }
  });
  
  if (categoriasUfMap.size > 0) {
    aggregated.categorias_por_uf = {};
    for (const [uf, categories] of categoriasUfMap) {
      const totalUf = Array.from(categories.values()).reduce((sum, c) => sum + (c.faturamento || 0), 0);
      aggregated.categorias_por_uf[uf] = Array.from(categories.values())
        .map(c => ({
          ...c,
          percentual: totalUf > 0 ? Math.round((c.faturamento / totalUf) * 100) : 0
        }))
        .sort((a, b) => (b.faturamento || 0) - (a.faturamento || 0));
    }
  }

  // Merge vendedores por mês
  const vendedoresMesMap = new Map<string, Map<string, any>>();
  allFacts.forEach(f => {
    const data = f.facts?.vendedores_por_mes || [];
    data.forEach((v: any) => {
      const sellerKey = v.vendedor?.toLowerCase();
      if (!sellerKey) return;
      if (!vendedoresMesMap.has(sellerKey)) {
        vendedoresMesMap.set(sellerKey, new Map());
      }
      const monthsMap = vendedoresMesMap.get(sellerKey)!;
      (v.meses || []).forEach((m: any) => {
        if (!monthsMap.has(m.mes)) {
          monthsMap.set(m.mes, { ...m });
        } else {
          const existing = monthsMap.get(m.mes)!;
          existing.faturamento = (existing.faturamento || 0) + (m.faturamento || 0);
          existing.qtd_pedidos = (existing.qtd_pedidos || 0) + (m.qtd_pedidos || 0);
          existing.quantidade = (existing.quantidade || 0) + (m.quantidade || 0);
        }
      });
    });
  });
  
  if (vendedoresMesMap.size > 0) {
    const result: any[] = [];
    for (const [seller, months] of vendedoresMesMap) {
      const monthlyData = Array.from(months.values())
        .sort((a, b) => a.mes.localeCompare(b.mes));
      
      // Recalcula crescimento MoM
      const monthlyWithGrowth = monthlyData.map((m, i) => ({
        ...m,
        crescimento_mom: i > 0 && monthlyData[i-1].faturamento > 0 
          ? Math.round(((m.faturamento - monthlyData[i-1].faturamento) / monthlyData[i-1].faturamento) * 100)
          : null
      }));
      
      const primeiro = monthlyData[0];
      const ultimo = monthlyData[monthlyData.length - 1];
      const tendencia = primeiro && ultimo && monthlyData.length > 1 && primeiro.faturamento > 0
        ? Math.round(((ultimo.faturamento - primeiro.faturamento) / primeiro.faturamento) * 100)
        : null;
      
      const faturamentoTotal = monthlyData.reduce((sum, m) => sum + (m.faturamento || 0), 0);
      
      result.push({
        vendedor: seller.charAt(0).toUpperCase() + seller.slice(1),
        meses: monthlyWithGrowth,
        total_meses: monthlyData.length,
        tendencia_geral: tendencia,
        faturamento_total: faturamentoTotal
      });
    }
    
    aggregated.vendedores_por_mes = result
      .sort((a, b) => b.faturamento_total - a.faturamento_total)
      .slice(0, 15);
  }
}
