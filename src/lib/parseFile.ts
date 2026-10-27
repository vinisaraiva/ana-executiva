import { read, utils } from 'xlsx';

export interface ParsedFile {
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
  totalRows: number;
}

const HEADER_KEYWORDS = [
  /^data$/i, /^date$/i, /^dt$/i,
  /^valor$/i, /^value$/i, /^preco$/i, /^price$/i,
  /^qtd$/i, /^quantidade$/i, /^qty$/i,
  /^produto$/i, /^product$/i, /^item$/i,
  /^cliente$/i, /^customer$/i,
  /^vendedor$/i, /^seller$/i,
  /^sku$/i, /^codigo$/i, /^code$/i,
  /^canal$/i, /^channel$/i, /^loja$/i,
  /^pedido$/i, /^order$/i, /^nf$/i,
  /^bruto$/i, /^liquido$/i, /^total$/i,
  /^desconto$/i, /^custo$/i, /^receita$/i
];

function detectHeaderRow(allRows: string[][]): { headerRowIndex: number; headers: string[] } {
  // Check first 5 rows for potential headers
  for (let i = 0; i < Math.min(5, allRows.length); i++) {
    const row = allRows[i];
    if (!row || row.length === 0) continue;

    let matches = 0;
    let nonEmptyCells = 0;

    for (const cell of row) {
      const cellStr = String(cell || '').toLowerCase().trim();
      if (!cellStr) continue;
      nonEmptyCells++;

      if (HEADER_KEYWORDS.some(pattern => pattern.test(cellStr))) {
        matches++;
      }
    }

    // If at least 3 header matches and enough non-empty cells
    if (matches >= 3 && nonEmptyCells >= 4) {
      return {
        headerRowIndex: i,
        headers: row.map(h => String(h || '').trim())
      };
    }
  }

  // Fallback: check if row 1 has more cells than row 0
  if (allRows.length > 1) {
    const row0NonEmpty = allRows[0].filter(c => String(c || '').trim()).length;
    const row1NonEmpty = allRows[1].filter(c => String(c || '').trim()).length;

    if (row1NonEmpty > row0NonEmpty * 2) {
      return {
        headerRowIndex: 1,
        headers: allRows[1].map(h => String(h || '').trim())
      };
    }
  }

  // Default to row 0
  return {
    headerRowIndex: 0,
    headers: allRows[0]?.map(h => String(h || '').trim()) || []
  };
}

export async function parseFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Falha ao ler arquivo');
        }

        const workbook = read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const allRows: string[][] = utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        });

        if (allRows.length < 2) {
          throw new Error('Arquivo não contém dados suficientes');
        }

        const { headerRowIndex, headers } = detectHeaderRow(allRows);
        const dataRows = allRows
          .slice(headerRowIndex + 1)
          .filter(row => row.some(cell => String(cell || '').trim() !== ''));

        resolve({
          headers,
          rows: dataRows,
          headerRowIndex,
          totalRows: dataRows.length
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Erro ao processar arquivo'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function autoDetectMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {
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

  const patterns: Record<string, RegExp[]> = {
    date: [/^data$/i, /^date$/i, /^dt$/i, /data.*venda/i, /emissao/i],
    quantity: [/^qtd$/i, /^qty$/i, /^quantidade$/i, /quantity/i, /unid/i],
    grossValue: [/bruto/i, /gross/i, /valor.*bruto/i],
    discountValue: [/desconto/i, /discount/i, /^desc$/i],
    netValue: [/liquido/i, /^net$/i, /total/i, /valor/i, /value/i, /receita/i, /faturamento/i],
    costValue: [/custo/i, /cost/i, /cmv/i],
    sku: [/^sku$/i, /^cod$/i, /^code$/i, /^ref$/i, /codigo.*prod/i],
    productName: [/^produto$/i, /^product$/i, /^item$/i, /descricao/i, /description/i],
    channel: [/^canal$/i, /^channel$/i, /^loja$/i, /^store$/i, /marketplace/i],
    customerName: [/^cliente$/i, /^customer$/i, /comprador/i, /razao.*social/i],
    sellerName: [/^vendedor$/i, /^seller$/i, /representante/i, /consultor/i],
    orderId: [/^pedido$/i, /^order$/i, /^nf$/i, /nota.*fiscal/i, /num.*ped/i],
    city: [/^cidade$/i, /^city$/i, /municipio/i],
    state: [/^uf$/i, /^estado$/i, /^state$/i],
    category: [/^categoria$/i, /^category$/i, /^grupo$/i, /segmento/i],
    unitPrice: [/preco.*unit/i, /unit.*price/i, /valor.*unit/i],
    taxValue: [/^imposto/i, /^tax/i, /^icms$/i, /tributo/i],
    paymentMethod: [/^pagamento$/i, /forma.*pag/i, /payment/i, /meio.*pag/i],
    status: [/^status$/i, /^situacao$/i, /^situação$/i, /^estado.*ped/i, /cancelad/i, /estorn/i]
  };

  const usedColumns = new Set<number>();
  const priorityOrder = [
    'date', 'sku', 'orderId', 'sellerName', 'customerName', 'channel',
    'city', 'state', 'category', 'paymentMethod', 'unitPrice', 'taxValue',
    'productName', 'grossValue', 'costValue', 'discountValue', 'quantity', 'netValue', 'status'
  ];

  for (const key of priorityOrder) {
    const regexes = patterns[key] || [];
    for (let i = 0; i < headers.length; i++) {
      if (usedColumns.has(i)) continue;
      const header = headers[i].toLowerCase();

      if (regexes.some(r => r.test(header))) {
        mapping[key] = i;
        usedColumns.add(i);
        break;
      }
    }
  }

  return mapping;
}

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
 * Detect the date range from parsed file data
 * Returns min and max dates found in the date column
 */
export function detectDateRange(
  parsedFile: ParsedFile, 
  dateColumnIndex: number
): { startDate: string | null; endDate: string | null } {
  if (dateColumnIndex < 0 || !parsedFile.rows.length) {
    return { startDate: null, endDate: null };
  }

  const dates: Date[] = [];
  
  for (const row of parsedFile.rows) {
    const cellValue = row[dateColumnIndex];
    if (!cellValue) continue;
    
    // Try to parse the date
    const dateStr = String(cellValue).trim();
    let date: Date | null = null;
    
    // Try different date formats
    // Excel serial number
    if (/^\d+$/.test(dateStr) && parseInt(dateStr) > 40000 && parseInt(dateStr) < 50000) {
      // Excel serial date
      const excelDate = parseInt(dateStr);
      date = new Date((excelDate - 25569) * 86400 * 1000);
    } 
    // ISO format: 2024-01-15
    else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      date = new Date(dateStr);
    }
    // DD/MM/YYYY or DD-MM-YYYY
    else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(dateStr)) {
      const parts = dateStr.split(/[\/\-]/);
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      date = new Date(year, month, day);
    }
    // MM/DD/YYYY
    else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateStr)) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }
    
    if (date && !isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100) {
      dates.push(date);
    }
  }

  if (dates.length === 0) {
    return { startDate: null, endDate: null };
  }

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Format as ISO date string (YYYY-MM-DD)
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return {
    startDate: formatDate(minDate),
    endDate: formatDate(maxDate)
  };
}
