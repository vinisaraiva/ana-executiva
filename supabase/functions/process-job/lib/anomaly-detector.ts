/**
 * Anomaly detection for sales data
 */

import { round } from "./value-parsers.ts";
import type { SalesLine, Anomaly } from "../types/sales.ts";

/**
 * Detect anomalies in sales data
 */
export function detectAnomalies(
  salesLines: SalesLine[], 
  tenantId: string, 
  importRunId: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // 1. High-value outliers
  detectHighValueOutliers(salesLines, tenantId, importRunId, anomalies);
  
  // 2. Zero/negative values
  detectZeroOrNegativeValues(salesLines, tenantId, importRunId, anomalies);
  
  // 3. Duplicate order IDs
  detectDuplicateOrderIds(salesLines, tenantId, importRunId, anomalies);
  
  // 4. Negative margin products
  detectNegativeMarginProducts(salesLines, tenantId, importRunId, anomalies);
  
  // 5. Sales drop detection (month over month)
  detectSalesDrops(salesLines, tenantId, importRunId, anomalies);
  
  // 6. Seller performance drop
  detectSellerDrops(salesLines, tenantId, importRunId, anomalies);

  return anomalies;
}

function detectHighValueOutliers(
  salesLines: SalesLine[], 
  tenantId: string, 
  importRunId: string,
  anomalies: Anomaly[]
): void {
  const values = salesLines.map(l => l.net_value).filter(v => v > 0);
  if (values.length < 10) return;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
  const threshold = mean + 3 * stdDev;

  const outliers = salesLines.filter(l => l.net_value > threshold);
  if (outliers.length > 0 && outliers.length < salesLines.length * 0.05) {
    anomalies.push({
      tenant_id: tenantId,
      import_run_id: importRunId,
      code: 'HIGH_VALUE_OUTLIER',
      title: `${outliers.length} vendas com valor muito acima da média`,
      severity: 'warning',
      details: {
        count: outliers.length,
        threshold: round(threshold),
        mean: round(mean),
        examples: outliers.slice(0, 5).map(o => ({
          value: o.net_value,
          date: o.sale_date,
          product: o.product_name
        }))
      }
    });
  }
}

function detectZeroOrNegativeValues(
  salesLines: SalesLine[], 
  tenantId: string, 
  importRunId: string,
  anomalies: Anomaly[]
): void {
  const zeroOrNegative = salesLines.filter(l => l.net_value <= 0);
  if (zeroOrNegative.length > 0) {
    anomalies.push({
      tenant_id: tenantId,
      import_run_id: importRunId,
      code: 'ZERO_OR_NEGATIVE_VALUE',
      title: `${zeroOrNegative.length} vendas com valor zero ou negativo`,
      severity: zeroOrNegative.length > salesLines.length * 0.1 ? 'error' : 'warning',
      details: {
        count: zeroOrNegative.length,
        percentage: round((zeroOrNegative.length / salesLines.length) * 100)
      }
    });
  }
}

function detectDuplicateOrderIds(
  salesLines: SalesLine[], 
  tenantId: string, 
  importRunId: string,
  anomalies: Anomaly[]
): void {
  const orderIds = salesLines.map(l => l.order_id).filter(Boolean);
  const orderIdCounts = orderIds.reduce((acc, id) => {
    acc[id!] = (acc[id!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const duplicates = Object.entries(orderIdCounts).filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0 && duplicates.length < orderIds.length * 0.5) {
    anomalies.push({
      tenant_id: tenantId,
      import_run_id: importRunId,
      code: 'DUPLICATE_ORDER_IDS',
      title: `${duplicates.length} pedidos duplicados detectados`,
      severity: 'info',
      details: {
        count: duplicates.length,
        examples: duplicates.slice(0, 10).map(([id, count]) => ({ orderId: id, occurrences: count }))
      }
    });
  }
}

function detectNegativeMarginProducts(
  salesLines: SalesLine[], 
  tenantId: string, 
  importRunId: string,
  anomalies: Anomaly[]
): void {
  const productMargins = new Map<string, { revenue: number; cost: number }>();
  for (const line of salesLines) {
    const product = line.product_name || line.sku || 'Sem nome';
    if (!productMargins.has(product)) {
      productMargins.set(product, { revenue: 0, cost: 0 });
    }
    const data = productMargins.get(product)!;
    data.revenue += line.net_value;
    data.cost += line.cost_value;
  }

  const negativeMarginProducts = Array.from(productMargins.entries())
    .filter(([_, data]) => data.cost > 0 && data.revenue < data.cost)
    .map(([name, data]) => ({ 
      name, 
      revenue: round(data.revenue), 
      cost: round(data.cost), 
      margin: round(data.revenue - data.cost) 
    }));

  if (negativeMarginProducts.length > 0) {
    anomalies.push({
      tenant_id: tenantId,
      import_run_id: importRunId,
      code: 'NEGATIVE_MARGIN_PRODUCTS',
      title: `${negativeMarginProducts.length} produtos com margem negativa`,
      severity: 'error',
      details: {
        count: negativeMarginProducts.length,
        products: negativeMarginProducts.slice(0, 10)
      }
    });
  }
}

function detectSalesDrops(
  salesLines: SalesLine[], 
  tenantId: string, 
  importRunId: string,
  anomalies: Anomaly[]
): void {
  const monthlyRevenue = new Map<string, number>();
  for (const line of salesLines) {
    const date = new Date(line.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + line.net_value);
  }

  const months = Array.from(monthlyRevenue.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (let i = 1; i < months.length; i++) {
    const [currentMonth, currentValue] = months[i];
    const [previousMonth, previousValue] = months[i - 1];
    
    if (previousValue > 0) {
      const dropPercent = ((previousValue - currentValue) / previousValue) * 100;
      if (dropPercent > 30) {
        anomalies.push({
          tenant_id: tenantId,
          import_run_id: importRunId,
          code: 'SALES_DROP',
          title: `Queda de ${round(dropPercent)}% nas vendas de ${previousMonth} para ${currentMonth}`,
          severity: dropPercent > 50 ? 'error' : 'warning',
          details: {
            previous_month: previousMonth,
            current_month: currentMonth,
            previous_value: round(previousValue),
            current_value: round(currentValue),
            drop_percent: round(dropPercent)
          }
        });
      }
    }
  }
}

function detectSellerDrops(
  salesLines: SalesLine[], 
  tenantId: string, 
  importRunId: string,
  anomalies: Anomaly[]
): void {
  const sellerByMonth = new Map<string, Map<string, number>>();
  for (const line of salesLines) {
    const seller = line.seller_name;
    if (!seller) continue;
    
    const date = new Date(line.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!sellerByMonth.has(seller)) {
      sellerByMonth.set(seller, new Map());
    }
    const sellerMonths = sellerByMonth.get(seller)!;
    sellerMonths.set(monthKey, (sellerMonths.get(monthKey) || 0) + line.net_value);
  }

  for (const [seller, monthData] of sellerByMonth.entries()) {
    const sortedMonths = Array.from(monthData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedMonths.length >= 2) {
      const [lastMonth, lastValue] = sortedMonths[sortedMonths.length - 1];
      const [prevMonth, prevValue] = sortedMonths[sortedMonths.length - 2];
      
      if (prevValue > 0) {
        const dropPercent = ((prevValue - lastValue) / prevValue) * 100;
        if (dropPercent > 40) {
          anomalies.push({
            tenant_id: tenantId,
            import_run_id: importRunId,
            code: 'SELLER_DROP',
            title: `Vendedor ${seller} teve queda de ${round(dropPercent)}%`,
            severity: 'warning',
            details: {
              seller,
              previous_month: prevMonth,
              current_month: lastMonth,
              previous_value: round(prevValue),
              current_value: round(lastValue),
              drop_percent: round(dropPercent)
            }
          });
        }
      }
    }
  }
}
