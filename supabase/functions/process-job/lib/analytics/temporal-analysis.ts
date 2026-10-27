/**
 * Temporal analysis analytics
 */

import { round } from "../value-parsers.ts";
import { groupBySeller } from "./seller-rankings.ts";
import { groupByProduct } from "./product-rankings.ts";
import type { SalesLine } from "../../types/sales.ts";

export function calculateTemporalAnalysis(salesLines: SalesLine[]) {
  // Group by month
  const monthMap = new Map<string, { faturamento: number; quantidade: number; pedidos: Set<string> }>();
  const dayMap = new Map<string, { faturamento: number; quantidade: number }>();
  const weekdayMap = new Map<number, { faturamento: number; count: number }>();

  for (const line of salesLines) {
    const date = new Date(line.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = line.sale_date;
    const weekday = date.getDay();

    // Monthly
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { faturamento: 0, quantidade: 0, pedidos: new Set() });
    }
    const monthData = monthMap.get(monthKey)!;
    monthData.faturamento += line.net_value;
    monthData.quantidade += line.quantity;
    if (line.order_id) monthData.pedidos.add(line.order_id);

    // Daily
    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, { faturamento: 0, quantidade: 0 });
    }
    const dayData = dayMap.get(dayKey)!;
    dayData.faturamento += line.net_value;
    dayData.quantidade += line.quantity;

    // Weekday
    if (!weekdayMap.has(weekday)) {
      weekdayMap.set(weekday, { faturamento: 0, count: 0 });
    }
    const weekdayData = weekdayMap.get(weekday)!;
    weekdayData.faturamento += line.net_value;
    weekdayData.count++;
  }

  // Monthly with MoM growth
  const months = Array.from(monthMap.entries())
    .map(([mes, data]) => ({
      mes,
      faturamento: round(data.faturamento),
      quantidade: round(data.quantidade),
      qtd_pedidos: data.pedidos.size
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  const monthlyWithGrowth = months.map((m, i) => ({
    ...m,
    crescimento_mom: i > 0 && months[i-1].faturamento > 0 
      ? round(((m.faturamento - months[i-1].faturamento) / months[i-1].faturamento) * 100)
      : null
  }));

  // Best and worst days
  const days = Array.from(dayMap.entries())
    .map(([data, info]) => ({ data, faturamento: round(info.faturamento) }))
    .sort((a, b) => b.faturamento - a.faturamento);

  const melhorDia = days[0] || null;
  const piorDia = days[days.length - 1] || null;

  // Weekday averages
  const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const weekdayStats = Array.from(weekdayMap.entries())
    .map(([day, data]) => ({
      dia: weekdayNames[day],
      media_faturamento: round(data.faturamento / data.count),
      total_dias: data.count
    }))
    .sort((a, b) => weekdayNames.indexOf(a.dia) - weekdayNames.indexOf(b.dia));

  // Daily average
  const totalDays = dayMap.size;
  const totalRevenue = salesLines.reduce((sum, l) => sum + l.net_value, 0);
  const mediaDiaria = totalDays > 0 ? round(totalRevenue / totalDays) : 0;

  return {
    por_mes: monthlyWithGrowth,
    por_dia_semana: weekdayStats,
    melhor_dia: melhorDia,
    pior_dia: piorDia,
    media_diaria: mediaDiaria,
    total_dias_com_vendas: totalDays
  };
}

export function calculateYoYComparison(salesLines: SalesLine[]) {
  // Get all years in the data
  const yearMap = new Map<number, SalesLine[]>();
  
  for (const line of salesLines) {
    const year = new Date(line.sale_date).getFullYear();
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
    }
    yearMap.get(year)!.push(line);
  }

  const years = Array.from(yearMap.keys()).sort();
  
  if (years.length < 2) {
    return { disponivel: false, motivo: 'Dados de apenas um ano' };
  }

  const currentYear = years[years.length - 1];
  const previousYear = years[years.length - 2];

  const currentLines = yearMap.get(currentYear)!;
  const previousLines = yearMap.get(previousYear)!;

  // Company YoY
  const currentTotal = currentLines.reduce((sum, l) => sum + l.net_value, 0);
  const previousTotal = previousLines.reduce((sum, l) => sum + l.net_value, 0);
  const empresaVariacao = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  // Seller YoY
  const currentBySeller = groupBySeller(currentLines);
  const previousBySeller = groupBySeller(previousLines);
  const sellerYoY = Array.from(new Set([...currentBySeller.keys(), ...previousBySeller.keys()]))
    .map(seller => {
      const atual = currentBySeller.get(seller) || 0;
      const anterior = previousBySeller.get(seller) || 0;
      return {
        nome: seller,
        atual: round(atual),
        anterior: round(anterior),
        variacao: anterior > 0 ? round(((atual - anterior) / anterior) * 100) : null
      };
    })
    .filter(s => s.nome !== 'Não identificado')
    .sort((a, b) => b.atual - a.atual)
    .slice(0, 10);

  // Product YoY
  const currentByProduct = groupByProduct(currentLines);
  const previousByProduct = groupByProduct(previousLines);
  const productYoY = Array.from(new Set([...currentByProduct.keys(), ...previousByProduct.keys()]))
    .map(product => {
      const atual = currentByProduct.get(product) || 0;
      const anterior = previousByProduct.get(product) || 0;
      return {
        nome: product,
        atual: round(atual),
        anterior: round(anterior),
        variacao: anterior > 0 ? round(((atual - anterior) / anterior) * 100) : null
      };
    })
    .filter(p => p.nome !== 'Sem nome')
    .sort((a, b) => b.atual - a.atual)
    .slice(0, 10);

  return {
    disponivel: true,
    empresa: {
      ano_atual: currentYear,
      ano_anterior: previousYear,
      faturamento_atual: round(currentTotal),
      faturamento_anterior: round(previousTotal),
      variacao_percentual: round(empresaVariacao)
    },
    por_vendedor: sellerYoY,
    por_produto: productYoY
  };
}
