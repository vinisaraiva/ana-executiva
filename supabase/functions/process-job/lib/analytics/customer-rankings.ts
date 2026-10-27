/**
 * Customer rankings analytics
 */

import { round } from "../value-parsers.ts";
import type { SalesLine } from "../../types/sales.ts";

export function calculateCustomerRankings(salesLines: SalesLine[]) {
  const customerMap = new Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number; 
    firstDate: string 
  }>();
  
  for (const line of salesLines) {
    const customer = line.customer_name || 'Cliente não identificado';
    if (!customerMap.has(customer)) {
      customerMap.set(customer, { 
        faturamento: 0, 
        pedidos: new Set(), 
        quantidade: 0, 
        firstDate: line.sale_date 
      });
    }
    const data = customerMap.get(customer)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
    if (line.sale_date < data.firstDate) data.firstDate = line.sale_date;
  }

  const allCustomers = Array.from(customerMap.entries())
    .map(([nome, data]) => ({
      nome,
      faturamento: round(data.faturamento),
      qtd_pedidos: data.pedidos.size || 1,
      quantidade: round(data.quantidade),
      ticket_medio: round(data.faturamento / (data.pedidos.size || 1)),
      primeira_compra: data.firstDate
    }))
    .filter(c => c.nome !== 'Cliente não identificado' || customerMap.size === 1);

  const byRevenue = [...allCustomers].sort((a, b) => b.faturamento - a.faturamento);
  const byFrequency = [...allCustomers].sort((a, b) => b.qtd_pedidos - a.qtd_pedidos);

  // Bottom rankings
  const lowestRevenue = [...allCustomers].sort((a, b) => a.faturamento - b.faturamento);

  // New vs recurring customers (simple heuristic: >1 order = recurring)
  const recorrentes = allCustomers.filter(c => c.qtd_pedidos > 1).length;
  const novos = allCustomers.length - recorrentes;

  return {
    top_20_faturamento: byRevenue.slice(0, 20),
    top_20_frequencia: byFrequency.slice(0, 20),
    bottom_20_faturamento: lowestRevenue.slice(0, 20),
    total_clientes: allCustomers.length,
    clientes_recorrentes: recorrentes,
    clientes_novos: novos
  };
}
