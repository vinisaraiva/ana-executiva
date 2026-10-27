/**
 * File parsing utilities for Excel import
 */

import { read, utils } from "https://esm.sh/xlsx@0.18.5";
import { getSupabaseAdmin } from "./job-queue.ts";
import type { HeaderDetectionResult } from "../types/sales.ts";

// Common header keywords for detection
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

/**
 * Download file from Supabase storage
 */
export async function downloadFile(filePath: string): Promise<ArrayBuffer> {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data: fileData, error: downloadError } = await supabaseAdmin
    .storage
    .from('imports')
    .download(filePath);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download file: ${downloadError?.message}`);
  }

  return fileData.arrayBuffer();
}

/**
 * Parse Excel file and return all rows
 */
export function parseExcelFile(arrayBuffer: ArrayBuffer): any[][] {
  const workbook = read(new Uint8Array(arrayBuffer), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
}

/**
 * Detect the actual header row (skip title rows)
 */
export function detectHeaderRow(allRows: any[]): HeaderDetectionResult {
  // Check first 5 rows for potential headers
  for (let i = 0; i < Math.min(5, allRows.length); i++) {
    const row = allRows[i];
    if (!row || row.length === 0) continue;
    
    // Count how many cells match header patterns
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
    
    // If at least 3 header matches and enough non-empty cells, this is the header row
    if (matches >= 3 && nonEmptyCells >= 4) {
      console.log(`[HeaderDetection] Found header row at index ${i} with ${matches} matches`);
      return {
        headerRowIndex: i,
        headers: row.map((h: any) => String(h || '').toLowerCase().trim())
      };
    }
  }
  
  // Fallback: check if row 1 (second row) looks more like headers than row 0
  if (allRows.length > 1) {
    const row0 = allRows[0];
    const row1 = allRows[1];
    
    // If row0 has mostly empty cells or just one long title, use row1
    const row0NonEmpty = row0.filter((c: any) => String(c || '').trim()).length;
    const row1NonEmpty = row1.filter((c: any) => String(c || '').trim()).length;
    
    if (row1NonEmpty > row0NonEmpty * 2) {
      console.log(`[HeaderDetection] Row 1 has more cells (${row1NonEmpty} vs ${row0NonEmpty}), using as header`);
      return {
        headerRowIndex: 1,
        headers: row1.map((h: any) => String(h || '').toLowerCase().trim())
      };
    }
  }
  
  // Default to row 0
  console.log(`[HeaderDetection] Using default row 0 as header`);
  return {
    headerRowIndex: 0,
    headers: allRows[0].map((h: any) => String(h || '').toLowerCase().trim())
  };
}

/**
 * Extract data rows (after header)
 */
export function extractDataRows(allRows: any[][], headerRowIndex: number): any[][] {
  return allRows
    .slice(headerRowIndex + 1)
    .filter(row => row.some((cell: any) => cell !== ''));
}
