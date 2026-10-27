/**
 * Seller rankings analytics
 */

import { round } from "../value-parsers.ts";
import type { SalesLine } from "../../types/sales.ts";

export function calculateSellerRankings(salesLines: SalesLine[]) {
  const sellerMap = new Map<string, { 
    faturamento: number; 
    quantidade: number; 
    pedidos: Set<string>; 
    custo: number 
  }>();
  
  for (const line of salesLines) {
    const seller = line.seller_name || 'Não identificado';
    if (!sellerMap.has(seller)) {
      sellerMap.set(seller, { faturamento: 0, quantidade: 0, pedidos: new Set(), custo: 0 });
    }
    const data = sellerMap.get(seller)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    data.custo += line.cost_value;
    if (line.order_id) data.pedidos.add(line.order_id);
  }

  const ranking = Array.from(sellerMap.entries())
    .map(([nome, data]) => ({
      nome,
      faturamento: round(data.faturamento),
      quantidade: round(data.quantidade),
      qtd_pedidos: data.pedidos.size || 1,
      ticket_medio: round(data.faturamento / (data.pedidos.size || 1)),
      margem: round(data.faturamento - data.custo),
      margem_percentual: data.faturamento > 0 
        ? round(((data.faturamento - data.custo) / data.faturamento) * 100) 
        : 0
    }))
    .filter(s => s.nome !== 'Não identificado' || sellerMap.size === 1)
    .sort((a, b) => b.faturamento - a.faturamento);

  // Bottom rankings
  const lowestRevenue = [...ranking].sort((a, b) => a.faturamento - b.faturamento);
  const lowestMargin = [...ranking].sort((a, b) => a.margem_percentual - b.margem_percentual);

  return {
    ranking_faturamento: ranking.slice(0, 20),
    ranking_quantidade: [...ranking].sort((a, b) => b.quantidade - a.quantidade).slice(0, 20),
    bottom_20_faturamento: lowestRevenue.slice(0, 20),
    bottom_20_margem: lowestMargin.slice(0, 20),
    total_vendedores: ranking.length
  };
}

export function groupBySeller(lines: SalesLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    const seller = line.seller_name || 'Não identificado';
    map.set(seller, (map.get(seller) || 0) + line.net_value);
  }
  return map;
}
