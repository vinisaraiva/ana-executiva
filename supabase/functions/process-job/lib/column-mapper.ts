/**
 * Column mapping utilities for sales data import
 */

import { parseDate, parseNumber } from "./value-parsers.ts";
import type { ColumnMapping } from "../types/sales.ts";

// Expanded patterns for Brazilian and international variations
// Order matters: more specific patterns first
const COLUMN_PATTERNS: Record<string, RegExp[]> = {
  // Date - very specific to avoid conflicts with other fields
  date: [
    /^data$/i, /^date$/i, /^dt$/i, /^dia$/i,
    /data.*venda/i, /data.*emiss/i, /data.*pedido/i, /data.*compra/i,
    /dt.*venda/i, /dt.*emiss/i, /sale.*date/i, /order.*date/i,
    /emissao/i, /competencia/i, /data.*nf/i, /data.*nota/i
  ],
  
  // Quantity - specific patterns
  quantity: [
    /^qtd$/i, /^qty$/i, /^quantidade$/i, /^quant$/i,
    /qtd.*vend/i, /quantidade/i, /quantity/i,
    /unid/i, /^un$/i, /pecas/i, /pcs/i, /volume/i, /itens/i
  ],
  
  // Gross value - specific patterns for "bruto"
  grossValue: [
    /bruto/i, /gross/i, /valor.*bruto/i, /total.*bruto/i, /receita.*bruta/i,
    /faturamento.*bruto/i, /revenue.*gross/i, /vl.*bruto/i, /vlr.*bruto/i
  ],
  
  // Discount - specific patterns
  discountValue: [
    /desconto/i, /discount/i, /^desc$/i, /rebate/i, /abatimento/i
  ],
  
  // Cost - specific patterns
  costValue: [
    /custo/i, /cost/i, /cogs/i, /cmv/i, /^cst$/i, /valor.*custo/i
  ],
  
  // SKU/Code - specific patterns for codes
  sku: [
    /^sku$/i, /^cod$/i, /^code$/i, /^ref$/i, /^ean$/i,
    /codigo.*prod/i, /cod.*prod/i, /referencia/i, /barcode/i, /codigo.*item/i
  ],
  
  // Product name - after SKU to avoid conflicts
  productName: [
    /^produto$/i, /^product$/i, /^item$/i, /^mercadoria$/i, /^artigo$/i,
    /descricao.*prod/i, /desc.*prod/i, /nome.*prod/i, /produto/i, /product/i,
    /descricao/i, /description/i
  ],
  
  // Channel/Store
  channel: [
    /^canal$/i, /^channel$/i, /^loja$/i, /^store$/i, /^origem$/i,
    /marketplace/i, /plataforma/i, /source/i, /canal.*venda/i, /ponto.*venda/i, /pdv/i
  ],
  
  // Customer - many variations
  customerName: [
    /^cliente$/i, /^customer$/i, /^comprador$/i, /^buyer$/i,
    /nome.*cliente/i, /razao.*social/i, /empresa/i, /company/i,
    /cliente/i, /customer/i, /destinatario/i
  ],
  
  // Seller - many Brazilian variations
  sellerName: [
    /^vendedor$/i, /^seller$/i, /^representante$/i, /^rep$/i,
    /^consultor$/i, /^atendente$/i, /^promotor$/i,
    /vendedor/i, /seller/i, /salesperson/i, /sales.*rep/i,
    /representante/i, /consultor/i, /atendente/i, /agente/i, /corretor/i
  ],
  
  // Order ID - many variations
  orderId: [
    /^pedido$/i, /^order$/i, /^venda$/i, /^nf$/i,
    /num.*ped/i, /numero.*pedido/i, /order.*id/i, /sale.*id/i,
    /nota.*fiscal/i, /nf.*e/i, /numero.*venda/i, /cod.*ped/i, /id.*venda/i
  ],
  
  // City
  city: [
    /^cidade$/i, /^city$/i, /^municipio$/i, /^muni$/i, /cidade/i
  ],
  
  // State/UF
  state: [
    /^uf$/i, /^estado$/i, /^state$/i, /^sigla$/i, /unidade.*fed/i
  ],
  
  // Category
  category: [
    /^categoria$/i, /^category$/i, /^grupo$/i, /^segmento$/i, /^linha$/i, /^familia$/i,
    /categoria.*prod/i, /grupo.*prod/i, /linha.*prod/i
  ],
  
  // Unit Price
  unitPrice: [
    /pre[çc]o.*unit/i, /unit.*price/i, /valor.*unit/i, /^pv$/i, /^pu$/i,
    /preco.*venda/i, /unit/i
  ],
  
  // Tax Value
  taxValue: [
    /^imposto/i, /^tax/i, /^icms$/i, /^tributo/i, /^impostos$/i,
    /valor.*imposto/i, /total.*imposto/i, /carga.*tribut/i
  ],
  
  // Payment Method
  paymentMethod: [
    /^pagamento$/i, /^payment$/i, /forma.*pag/i, /payment.*method/i,
    /meio.*pag/i, /tipo.*pag/i, /metodo.*pag/i, /condicao.*pag/i,
    /^pag$/i, /modalidade/i
  ],
  
  // Net value - generic patterns (last to avoid stealing other columns)
  netValue: [
    /liquido/i, /^net$/i, /valor.*liquido/i, /total.*liquido/i, /receita.*liquida/i,
    /faturamento/i, /receita/i, /revenue/i, /sales/i,
    /total/i, /valor/i, /value/i, /vlr/i, /vl\b/i, /preco/i, /price/i, /montante/i
  ],
  
  // Status - sale status (canceled, refunded, etc)
  status: [
    /^status$/i, /^situacao$/i, /^situação$/i, /estado.*ped/i, /estado.*venda/i,
    /situacao.*ped/i, /situação.*ped/i, /cancelad/i, /estorn/i
  ]
};

// Priority order - most specific fields first to avoid conflicts
const PRIORITY_ORDER = [
  'date', 'sku', 'orderId', 'sellerName', 'customerName', 'channel',
  'city', 'state', 'category', 'paymentMethod', 'unitPrice', 'taxValue',
  'productName', 'grossValue', 'costValue', 'discountValue', 'quantity', 'netValue', 'status'
];

/**
 * Apply user-provided column mapping from wizard
 */
export function applyUserColumnMapping(userMapping: Record<string, number>): ColumnMapping {
  return {
    date: userMapping.date ?? -1,
    quantity: userMapping.quantity ?? -1,
    grossValue: userMapping.grossValue ?? -1,
    discountValue: userMapping.discountValue ?? -1,
    netValue: userMapping.netValue ?? -1,
    costValue: userMapping.costValue ?? -1,
    sku: userMapping.sku ?? -1,
    productName: userMapping.productName ?? -1,
    channel: userMapping.channel ?? -1,
    customerName: userMapping.customerName ?? -1,
    sellerName: userMapping.sellerName ?? -1,
    orderId: userMapping.orderId ?? -1,
    city: userMapping.city ?? -1,
    state: userMapping.state ?? -1,
    category: userMapping.category ?? -1,
    unitPrice: userMapping.unitPrice ?? -1,
    taxValue: userMapping.taxValue ?? -1,
    paymentMethod: userMapping.paymentMethod ?? -1,
    status: userMapping.status ?? -1
  };
}

/**
 * Auto-detect column mapping from headers
 */
export function detectColumnMapping(headers: string[], dataRows: any[] = []): ColumnMapping {
  const mapping: ColumnMapping = {
    date: -1,
    quantity: -1,
    grossValue: -1,
    discountValue: -1,
    netValue: -1,
    costValue: -1,
    sku: -1,
    productName: -1,
    channel: -1,
    customerName: -1,
    sellerName: -1,
    orderId: -1,
    city: -1,
    state: -1,
    category: -1,
    unitPrice: -1,
    taxValue: -1,
    paymentMethod: -1,
    status: -1
  };

  // Track used columns to prevent conflicts
  const usedColumns = new Set<number>();

  // First pass: exact matches (^pattern$)
  for (const key of PRIORITY_ORDER) {
    const regexes = COLUMN_PATTERNS[key] || [];
    for (let i = 0; i < headers.length; i++) {
      if (usedColumns.has(i)) continue;
      const header = headers[i];
      // Check only exact match patterns first
      const exactPatterns = regexes.filter(r => r.source.startsWith('^') && r.source.endsWith('$'));
      if (exactPatterns.some(r => r.test(header))) {
        (mapping as any)[key] = i;
        usedColumns.add(i);
        console.log(`[ColumnMap] Exact match: "${header}" -> ${key} (col ${i})`);
        break;
      }
    }
  }

  // Second pass: partial matches
  for (const key of PRIORITY_ORDER) {
    if ((mapping as any)[key] !== -1) continue; // Already found
    const regexes = COLUMN_PATTERNS[key] || [];
    for (let i = 0; i < headers.length; i++) {
      if (usedColumns.has(i)) continue;
      const header = headers[i];
      if (regexes.some(r => r.test(header))) {
        (mapping as any)[key] = i;
        usedColumns.add(i);
        console.log(`[ColumnMap] Partial match: "${header}" -> ${key} (col ${i})`);
        break;
      }
    }
  }

  // Fallback: try to detect date column by content if not found
  if (mapping.date === -1) {
    for (let i = 0; i < headers.length && i < 5; i++) {
      if (usedColumns.has(i)) continue;
      const sampleValue = dataRows[0]?.[i];
      if (sampleValue && parseDate(sampleValue)) {
        mapping.date = i;
        usedColumns.add(i);
        console.log(`[ColumnMap] Fallback date by content: col ${i} (sample: ${sampleValue})`);
        break;
      }
    }
  }

  // Fallback: detect numeric columns for values if not found
  if (mapping.netValue === -1 && mapping.grossValue === -1) {
    const numericAnalysis = analyzeNumericColumns(headers, dataRows, usedColumns);
    if (numericAnalysis.valueCol !== -1) {
      mapping.netValue = numericAnalysis.valueCol;
      usedColumns.add(numericAnalysis.valueCol);
      console.log(`[ColumnMap] Fallback value by content: col ${numericAnalysis.valueCol}`);
    }
    if (numericAnalysis.qtyCol !== -1 && mapping.quantity === -1) {
      mapping.quantity = numericAnalysis.qtyCol;
      usedColumns.add(numericAnalysis.qtyCol);
      console.log(`[ColumnMap] Fallback qty by content: col ${numericAnalysis.qtyCol}`);
    }
  }

  // Final fallback: if still no date, use first column
  if (mapping.date === -1 && headers.length > 0) {
    mapping.date = 0;
    console.log(`[ColumnMap] Final fallback: using col 0 for date`);
  }

  // If no net value but has gross, use gross
  if (mapping.netValue === -1 && mapping.grossValue !== -1) {
    mapping.netValue = mapping.grossValue;
    console.log(`[ColumnMap] Using grossValue column for netValue`);
  }

  return mapping;
}

/**
 * Helper to analyze numeric columns for automatic value/qty detection
 */
function analyzeNumericColumns(
  headers: string[], 
  dataRows: any[], 
  usedColumns: Set<number>
): { valueCol: number; qtyCol: number } {
  const numericCols: { index: number; avg: number; hasDecimals: boolean; maxVal: number }[] = [];
  
  const sampleSize = Math.min(10, dataRows.length);
  
  for (let col = 0; col < headers.length; col++) {
    if (usedColumns.has(col)) continue;
    
    const values: number[] = [];
    let hasDecimals = false;
    
    for (let row = 0; row < sampleSize; row++) {
      const val = parseNumber(dataRows[row]?.[col]);
      if (val > 0) {
        values.push(val);
        if (val % 1 !== 0) hasDecimals = true;
      }
    }
    
    if (values.length >= sampleSize * 0.5) { // At least 50% non-zero
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const maxVal = Math.max(...values);
      numericCols.push({ index: col, avg, hasDecimals, maxVal });
    }
  }
  
  // Sort by average value descending - highest average is likely the monetary value
  numericCols.sort((a, b) => b.avg - a.avg);
  
  const valueCol = numericCols[0]?.index ?? -1;
  
  // Quantity is likely a column with lower values and no decimals
  const qtyCol = numericCols.find(c => 
    c.index !== valueCol && 
    !c.hasDecimals && 
    c.avg < 1000 && 
    c.maxVal < 10000
  )?.index ?? -1;
  
  return { valueCol, qtyCol };
}
