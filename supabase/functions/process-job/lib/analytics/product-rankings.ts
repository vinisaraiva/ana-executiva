/**
 * Product rankings analytics
 */

import { round } from "../value-parsers.ts";
import type { SalesLine } from "../../types/sales.ts";

export function calculateProductRankings(salesLines: SalesLine[]) {
  const productMap = new Map<string, { 
    faturamento: number; 
    quantidade: number; 
    custo: number; 
    count: number 
  }>();
  
  for (const line of salesLines) {
    const product = line.product_name || line.sku || 'Sem nome';
    if (!productMap.has(product)) {
      productMap.set(product, { faturamento: 0, quantidade: 0, custo: 0, count: 0 });
    }
    const data = productMap.get(product)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    data.custo += line.cost_value;
    data.count++;
  }

  const allProducts = Array.from(productMap.entries())
    .map(([nome, data]) => ({
      nome,
      faturamento: round(data.faturamento),
      quantidade: round(data.quantidade),
      margem: round(data.faturamento - data.custo),
      margem_percentual: data.faturamento > 0 
        ? round(((data.faturamento - data.custo) / data.faturamento) * 100) 
        : 0,
      ticket_medio: round(data.faturamento / data.count)
    }));

  const byRevenue = [...allProducts].sort((a, b) => b.faturamento - a.faturamento);
  const byQuantity = [...allProducts].sort((a, b) => b.quantidade - a.quantidade);
  const byMargin = [...allProducts].sort((a, b) => b.margem_percentual - a.margem_percentual);
  const worstMargin = [...allProducts].sort((a, b) => a.margem_percentual - b.margem_percentual);
  
  // Bottom rankings (least sold)
  const lowestRevenue = [...allProducts].sort((a, b) => a.faturamento - b.faturamento);
  const lowestQuantity = [...allProducts].sort((a, b) => a.quantidade - b.quantidade);

  // ABC Curve
  const totalRevenue = allProducts.reduce((sum, p) => sum + p.faturamento, 0);
  let accumulated = 0;
  let curvaA = 0, curvaB = 0, curvaC = 0;
  let curvaAValue = 0, curvaBValue = 0, curvaCValue = 0;

  for (const product of byRevenue) {
    accumulated += product.faturamento;
    const pct = (accumulated / totalRevenue) * 100;
    if (pct <= 80) {
      curvaA++;
      curvaAValue += product.faturamento;
    } else if (pct <= 95) {
      curvaB++;
      curvaBValue += product.faturamento;
    } else {
      curvaC++;
      curvaCValue += product.faturamento;
    }
  }

  return {
    top_20_faturamento: byRevenue.slice(0, 20),
    top_20_quantidade: byQuantity.slice(0, 20),
    top_20_margem: byMargin.slice(0, 20),
    bottom_20_margem: worstMargin.slice(0, 20),
    bottom_20_faturamento: lowestRevenue.slice(0, 20),
    bottom_20_quantidade: lowestQuantity.slice(0, 20),
    curva_abc: {
      curva_a: { qtd: curvaA, percentual_faturamento: round((curvaAValue / totalRevenue) * 100) },
      curva_b: { qtd: curvaB, percentual_faturamento: round((curvaBValue / totalRevenue) * 100) },
      curva_c: { qtd: curvaC, percentual_faturamento: round((curvaCValue / totalRevenue) * 100) }
    },
    total_produtos: allProducts.length
  };
}

export function groupByProduct(lines: SalesLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    const product = line.product_name || line.sku || 'Sem nome';
    map.set(product, (map.get(product) || 0) + line.net_value);
  }
  return map;
}
