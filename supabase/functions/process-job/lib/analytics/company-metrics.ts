/**
 * Company metrics and comprehensive facts calculation
 */

import { round } from "../value-parsers.ts";
import { calculateSellerRankings } from "./seller-rankings.ts";
import { calculateProductRankings } from "./product-rankings.ts";
import { calculateCustomerRankings } from "./customer-rankings.ts";
import { calculateChannelAnalysis } from "./channel-analysis.ts";
import { calculateTemporalAnalysis, calculateYoYComparison } from "./temporal-analysis.ts";
import { 
  calculateCityAnalysis, 
  calculateStateAnalysis, 
  calculateCategoryAnalysis, 
  calculatePaymentMethodAnalysis 
} from "./geographic-analysis.ts";
import {
  calculateSellersByCity,
  calculateProductsByChannel,
  calculateSellersByProduct,
  calculateCategoriesByState,
  calculateSellersByMonth
} from "./cross-dimensional.ts";
import type { SalesLine } from "../../types/sales.ts";

export function calculateComprehensiveFacts(
  salesLines: SalesLine[], 
  minDate: Date | null, 
  maxDate: Date | null
) {
  // Basic totals
  const totalGross = salesLines.reduce((sum, l) => sum + l.gross_value, 0);
  const totalNet = salesLines.reduce((sum, l) => sum + l.net_value, 0);
  const totalCost = salesLines.reduce((sum, l) => sum + l.cost_value, 0);
  const totalDiscount = salesLines.reduce((sum, l) => sum + l.discount_value, 0);
  const totalQuantity = salesLines.reduce((sum, l) => sum + l.quantity, 0);
  const totalMargin = totalNet - totalCost;
  const marginPercent = totalNet > 0 ? (totalMargin / totalNet) * 100 : 0;

  const uniqueOrders = [...new Set(salesLines.map(l => l.order_id).filter(Boolean))];
  const uniqueProducts = [...new Set(salesLines.map(l => l.product_name || l.sku).filter(Boolean))];
  const uniqueCustomers = [...new Set(salesLines.map(l => l.customer_name).filter(Boolean))];
  const uniqueSellers = [...new Set(salesLines.map(l => l.seller_name).filter(Boolean))];

  const avgTicket = uniqueOrders.length > 0 ? totalNet / uniqueOrders.length : totalNet / salesLines.length;

  // Company KPIs
  const empresa = {
    total_faturamento_bruto: round(totalGross),
    total_faturamento_liquido: round(totalNet),
    total_custo: round(totalCost),
    total_desconto: round(totalDiscount),
    margem_bruta: round(totalMargin),
    margem_percentual: round(marginPercent),
    ticket_medio: round(avgTicket),
    total_pedidos: uniqueOrders.length || salesLines.length,
    total_itens: round(totalQuantity),
    total_linhas: salesLines.length,
    total_clientes_unicos: uniqueCustomers.length,
    total_produtos_unicos: uniqueProducts.length,
    total_vendedores: uniqueSellers.length
  };

  // Seller rankings
  const vendedores = calculateSellerRankings(salesLines);

  // Product rankings
  const produtos = calculateProductRankings(salesLines);

  // Customer rankings
  const clientes = calculateCustomerRankings(salesLines);

  // Channel analysis
  const canais = calculateChannelAnalysis(salesLines, totalNet);

  // Temporal analysis
  const temporal = calculateTemporalAnalysis(salesLines);

  // YoY comparison (if data spans multiple years)
  const comparativo_yoy = calculateYoYComparison(salesLines);

  // City analysis
  const cidades = calculateCityAnalysis(salesLines, totalNet);

  // State/UF analysis
  const estados = calculateStateAnalysis(salesLines, totalNet);

  // Category analysis
  const categorias = calculateCategoryAnalysis(salesLines, totalNet);

  // Payment method analysis
  const formas_pagamento = calculatePaymentMethodAnalysis(salesLines, totalNet);

  // Tax summary
  const totalTax = salesLines.reduce((sum, l) => sum + (l.tax_value || 0), 0);
  const impostos = {
    total_impostos: round(totalTax),
    percentual_sobre_bruto: totalGross > 0 ? round((totalTax / totalGross) * 100) : 0,
    imposto_medio_por_venda: salesLines.length > 0 ? round(totalTax / salesLines.length) : 0
  };

  // Cross-dimensional analyses
  const vendedores_por_cidade = calculateSellersByCity(salesLines);
  const produtos_por_canal = calculateProductsByChannel(salesLines);
  const vendedores_por_produto = calculateSellersByProduct(salesLines);
  const categorias_por_uf = calculateCategoriesByState(salesLines);
  const vendedores_por_mes = calculateSellersByMonth(salesLines);

  return {
    empresa,
    vendedores,
    produtos,
    clientes,
    canais,
    temporal,
    comparativo_yoy,
    cidades,
    estados,
    categorias,
    formas_pagamento,
    impostos,
    // Cross-dimensional facts
    vendedores_por_cidade,
    produtos_por_canal,
    vendedores_por_produto,
    categorias_por_uf,
    vendedores_por_mes,
    date_range: {
      start: minDate?.toISOString().split('T')[0],
      end: maxDate?.toISOString().split('T')[0]
    }
  };
}
