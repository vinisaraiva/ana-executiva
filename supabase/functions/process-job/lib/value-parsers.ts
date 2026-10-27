/**
 * Value parsing utilities for sales data import
 */

/**
 * Normalize status value from various formats to standardized values
 * Returns: null (normal), 'canceled', 'refunded', 'returned'
 */
export function normalizeStatus(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const normalized = String(value).toLowerCase().trim();
  
  // Patterns for canceled
  if (/cancelad|cancel|cancela/i.test(normalized)) {
    return 'canceled';
  }
  
  // Patterns for refunded/chargeback
  if (/estorn|refund|chargeback|devolu|devolvid/i.test(normalized)) {
    return 'refunded';
  }
  
  // Patterns for returned
  if (/retorn|return|devol.*cliente/i.test(normalized)) {
    return 'returned';
  }
  
  // If the value explicitly indicates a "normal" or "completed" sale
  if (/faturad|completo|concluíd|entregue|pago|aprovad|finaliz/i.test(normalized)) {
    return null; // Normal sale
  }
  
  // If value is empty or just spaces
  if (!normalized) {
    return null;
  }
  
  // Unknown status - return null (treat as normal)
  return null;
}

/**
 * Parse date from various formats
 * Supports: DD/MM/YYYY, YYYY-MM-DD, Excel serial numbers
 */
export function parseDate(value: any): Date | null {
  if (!value) return null;
  
  const str = String(value).trim();
  
  // DD/MM/YYYY format
  let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  // YYYY-MM-DD format (ISO)
  match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  // Excel serial number (days since 1899-12-30)
  const num = parseFloat(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + num * 86400000);
  }

  // Try native Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
    return parsed;
  }

  return null;
}

/**
 * Parse number from various formats
 * Handles: currency symbols, Brazilian/international decimal separators
 */
export function parseNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  
  let str = String(value).trim();
  
  // Remove currency symbols and spaces
  str = str.replace(/[R$€£\s]/g, '');
  
  // Handle Brazilian vs International number formats
  if (str.includes(',') && str.includes('.')) {
    // If comma comes after dot, it's Brazilian format (1.234,56)
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // International format (1,234.56)
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',') && !str.includes('.')) {
    // Only comma - likely decimal separator
    str = str.replace(',', '.');
  } else {
    // Only dot or no separator
    str = str.replace(/,/g, '');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Round a number to specified decimal places
 */
export function round(value: number, decimals = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Generate SHA-256 hash for row signature
 */
export async function generateRowSignature(
  tenantId: string,
  saleDate: string,
  orderId: string | null,
  sku: string | null,
  quantity: number,
  grossValue: number
): Promise<string> {
  const signatureData = `${tenantId}|${saleDate}|${orderId || ''}|${sku || ''}|${quantity}|${grossValue}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 32); // Use first 32 chars
}
