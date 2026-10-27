/**
 * Cross-dimensional analysis analytics
 */

import { round } from "../value-parsers.ts";
import type { SalesLine } from "../../types/sales.ts";

/**
 * Sellers by City (Top 5 per city)
 */
export function calculateSellersByCity(salesLines: SalesLine[]) {
  const citySellerMap = new Map<string, Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number 
  }>>();
  
  for (const line of salesLines) {
    const city = line.city || null;
    const seller = line.seller_name || null;
    if (!city || !seller) continue;
    
    if (!citySellerMap.has(city)) {
      citySellerMap.set(city, new Map());
    }
    const sellerMap = citySellerMap.get(city)!;
    
    if (!sellerMap.has(seller)) {
      sellerMap.set(seller, { faturamento: 0, pedidos: new Set(), quantidade: 0 });
    }
    const data = sellerMap.get(seller)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }
  
  if (citySellerMap.size === 0) return null;
  
  const result: Record<string, any[]> = {};
  for (const [city, sellers] of citySellerMap) {
    result[city] = Array.from(sellers.entries())
      .map(([nome, data]) => ({
        nome,
        faturamento: round(data.faturamento),
        quantidade: round(data.quantidade),
        qtd_pedidos: data.pedidos.size || 1
      }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 5);
  }
  
  return result;
}

/**
 * Products by Channel (Top 20 per channel)
 */
export function calculateProductsByChannel(salesLines: SalesLine[]) {
  const channelProductMap = new Map<string, Map<string, { 
    faturamento: number; 
    quantidade: number; 
    pedidos: Set<string> 
  }>>();
  
  for (const line of salesLines) {
    const channel = line.channel || null;
    const product = line.product_name || line.sku || null;
    if (!channel || !product) continue;
    
    if (!channelProductMap.has(channel)) {
      channelProductMap.set(channel, new Map());
    }
    const productMap = channelProductMap.get(channel)!;
    
    if (!productMap.has(product)) {
      productMap.set(product, { faturamento: 0, quantidade: 0, pedidos: new Set() });
    }
    const data = productMap.get(product)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }
  
  if (channelProductMap.size === 0) return null;
  
  const result: Record<string, any[]> = {};
  for (const [channel, products] of channelProductMap) {
    result[channel] = Array.from(products.entries())
      .map(([nome, data]) => ({
        nome,
        faturamento: round(data.faturamento),
        quantidade: round(data.quantidade),
        qtd_pedidos: data.pedidos.size || 1
      }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 20);
  }
  
  return result;
}

/**
 * Sellers by Product (Top 10 per product)
 */
export function calculateSellersByProduct(salesLines: SalesLine[]) {
  const productSellerMap = new Map<string, Map<string, { 
    faturamento: number; 
    quantidade: number; 
    pedidos: Set<string> 
  }>>();
  
  for (const line of salesLines) {
    const product = line.product_name || line.sku || null;
    const seller = line.seller_name || null;
    if (!product || !seller) continue;
    
    if (!productSellerMap.has(product)) {
      productSellerMap.set(product, new Map());
    }
    const sellerMap = productSellerMap.get(product)!;
    
    if (!sellerMap.has(seller)) {
      sellerMap.set(seller, { faturamento: 0, quantidade: 0, pedidos: new Set() });
    }
    const data = sellerMap.get(seller)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }
  
  if (productSellerMap.size === 0) return null;
  
  const result: Record<string, any[]> = {};
  for (const [product, sellers] of productSellerMap) {
    result[product] = Array.from(sellers.entries())
      .map(([nome, data]) => ({
        nome,
        faturamento: round(data.faturamento),
        quantidade: round(data.quantidade),
        qtd_pedidos: data.pedidos.size || 1
      }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 10);
  }
  
  return result;
}

/**
 * Categories by State/UF
 */
export function calculateCategoriesByState(salesLines: SalesLine[]) {
  const stateMap = new Map<string, Map<string, { faturamento: number; quantidade: number }>>();
  const stateTotals = new Map<string, number>();
  
  for (const line of salesLines) {
    const state = line.state || null;
    const category = line.category || null;
    if (!state || !category) continue;
    
    if (!stateMap.has(state)) {
      stateMap.set(state, new Map());
      stateTotals.set(state, 0);
    }
    const categoryMap = stateMap.get(state)!;
    stateTotals.set(state, (stateTotals.get(state) || 0) + line.net_value);
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { faturamento: 0, quantidade: 0 });
    }
    const data = categoryMap.get(category)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
  }
  
  if (stateMap.size === 0) return null;
  
  const result: Record<string, any[]> = {};
  for (const [state, categories] of stateMap) {
    const stateTotal = stateTotals.get(state) || 1;
    result[state] = Array.from(categories.entries())
      .map(([categoria, data]) => ({
        categoria,
        faturamento: round(data.faturamento),
        quantidade: round(data.quantidade),
        percentual: round((data.faturamento / stateTotal) * 100)
      }))
      .sort((a, b) => b.faturamento - a.faturamento);
  }
  
  return result;
}

/**
 * Sellers by Month (with trend)
 */
export function calculateSellersByMonth(salesLines: SalesLine[]) {
  const sellerMonthMap = new Map<string, Map<string, { 
    faturamento: number; 
    pedidos: Set<string>; 
    quantidade: number 
  }>>();
  
  for (const line of salesLines) {
    const seller = line.seller_name || null;
    if (!seller) continue;
    
    const date = new Date(line.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!sellerMonthMap.has(seller)) {
      sellerMonthMap.set(seller, new Map());
    }
    const monthMap = sellerMonthMap.get(seller)!;
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { faturamento: 0, pedidos: new Set(), quantidade: 0 });
    }
    const data = monthMap.get(monthKey)!;
    data.faturamento += line.net_value;
    data.quantidade += line.quantity;
    if (line.order_id) data.pedidos.add(line.order_id);
  }
  
  if (sellerMonthMap.size === 0) return null;
  
  const result: any[] = [];
  
  for (const [seller, months] of sellerMonthMap) {
    const monthlyData = Array.from(months.entries())
      .map(([mes, data]) => ({
        mes,
        faturamento: round(data.faturamento),
        qtd_pedidos: data.pedidos.size || 1,
        quantidade: round(data.quantidade)
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
    
    // Calculate MoM growth
    const monthlyWithGrowth = monthlyData.map((m, i) => ({
      ...m,
      crescimento_mom: i > 0 && monthlyData[i-1].faturamento > 0 
        ? round(((m.faturamento - monthlyData[i-1].faturamento) / monthlyData[i-1].faturamento) * 100)
        : null
    }));
    
    // Calculate overall trend (first vs last month)
    const primeiro = monthlyData[0];
    const ultimo = monthlyData[monthlyData.length - 1];
    const tendencia = primeiro && ultimo && monthlyData.length > 1 && primeiro.faturamento > 0
      ? round(((ultimo.faturamento - primeiro.faturamento) / primeiro.faturamento) * 100)
      : null;
    
    const faturamentoTotal = monthlyData.reduce((sum, m) => sum + m.faturamento, 0);
    
    result.push({
      vendedor: seller,
      meses: monthlyWithGrowth,
      total_meses: monthlyData.length,
      tendencia_geral: tendencia,
      faturamento_total: round(faturamentoTotal)
    });
  }
  
  // Sort by total revenue and limit to top 15
  return result
    .sort((a, b) => b.faturamento_total - a.faturamento_total)
    .slice(0, 15);
}
