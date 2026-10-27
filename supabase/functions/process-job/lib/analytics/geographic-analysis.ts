/**
 * Geographic and categorical analysis analytics
 */

import { round } from "../value-parsers.ts";
import type { SalesLine } from "../../types/sales.ts";

export function calculateCityAnalysis(salesLines: SalesLine[], totalNet: number) {
  const cityMap = new Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number 
  }>();
  
  for (const line of salesLines) {
    const city = line.city || null;
    if (!city) continue;
    
    if (!cityMap.has(city)) {
      cityMap.set(city, { faturamento: 0, pedidos: new Set(), quantidade: 0 });
    }
    const data = cityMap.get(city)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }

  if (cityMap.size === 0) return null;

  const cities = Array.from(cityMap.entries())
    .map(([nome, data]) => ({
      nome,
      faturamento: round(data.faturamento),
      percentual: totalNet > 0 ? round((data.faturamento / totalNet) * 100) : 0,
      qtd_pedidos: data.pedidos.size || 1,
      quantidade: round(data.quantidade),
      ticket_medio: round(data.faturamento / (data.pedidos.size || 1))
    }))
    .sort((a, b) => b.faturamento - a.faturamento);

  // Bottom 20 cities (lowest revenue)
  const lowestCities = [...cities].sort((a, b) => a.faturamento - b.faturamento);

  return {
    top_20: cities.slice(0, 20),
    bottom_20: lowestCities.slice(0, 20),
    total_cidades: cities.length
  };
}

export function calculateStateAnalysis(salesLines: SalesLine[], totalNet: number) {
  const stateMap = new Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number 
  }>();
  
  for (const line of salesLines) {
    const state = line.state || null;
    if (!state) continue;
    
    if (!stateMap.has(state)) {
      stateMap.set(state, { faturamento: 0, pedidos: new Set(), quantidade: 0 });
    }
    const data = stateMap.get(state)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }

  if (stateMap.size === 0) return null;

  return Array.from(stateMap.entries())
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

export function calculateCategoryAnalysis(salesLines: SalesLine[], totalNet: number) {
  const categoryMap = new Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number; 
    custo: number 
  }>();
  
  for (const line of salesLines) {
    const category = line.category || null;
    if (!category) continue;
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { faturamento: 0, pedidos: new Set(), quantidade: 0, custo: 0 });
    }
    const data = categoryMap.get(category)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    data.custo += line.cost_value;
    if (line.order_id) data.pedidos.add(line.order_id);
  }

  if (categoryMap.size === 0) return null;

  return Array.from(categoryMap.entries())
    .map(([nome, data]) => ({
      nome,
      faturamento: round(data.faturamento),
      percentual: totalNet > 0 ? round((data.faturamento / totalNet) * 100) : 0,
      qtd_pedidos: data.pedidos.size || 1,
      quantidade: round(data.quantidade),
      margem_percentual: data.faturamento > 0 
        ? round(((data.faturamento - data.custo) / data.faturamento) * 100) 
        : 0
    }))
    .sort((a, b) => b.faturamento - a.faturamento);
}

export function calculatePaymentMethodAnalysis(salesLines: SalesLine[], totalNet: number) {
  const paymentMap = new Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number 
  }>();
  
  for (const line of salesLines) {
    const payment = line.payment_method || null;
    if (!payment) continue;
    
    if (!paymentMap.has(payment)) {
      paymentMap.set(payment, { faturamento: 0, pedidos: new Set(), quantidade: 0 });
    }
    const data = paymentMap.get(payment)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }

  if (paymentMap.size === 0) return null;

  return Array.from(paymentMap.entries())
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
