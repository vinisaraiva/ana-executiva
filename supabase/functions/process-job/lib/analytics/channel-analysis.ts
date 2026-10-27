/**
 * Channel analysis analytics
 */

import { round } from "../value-parsers.ts";
import type { SalesLine } from "../../types/sales.ts";

export function calculateChannelAnalysis(salesLines: SalesLine[], totalNet: number) {
  const channelMap = new Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number 
  }>();
  
  for (const line of salesLines) {
    const channel = line.channel || 'Não identificado';
    if (!channelMap.has(channel)) {
      channelMap.set(channel, { faturamento: 0, pedidos: new Set(), quantidade: 0 });
    }
    const data = channelMap.get(channel)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }

  return Array.from(channelMap.entries())
    .map(([nome, data]) => ({
      nome,
      faturamento: round(data.faturamento),
      percentual: totalNet > 0 ? round((data.faturamento / totalNet) * 100) : 0,
      qtd_pedidos: data.pedidos.size || 1,
      quantidade: round(data.quantidade),
      ticket_medio: round(data.faturamento / (data.pedidos.size || 1))
    }))
    .sort((a, b) => b.faturamento - a.faturamento);
}
