/**
 * Main import processor - orchestrates the import sales job
 */

import { getSupabaseAdmin } from "./job-queue.ts";
import { downloadFile, parseExcelFile, detectHeaderRow, extractDataRows } from "./file-parser.ts";
import { applyUserColumnMapping, detectColumnMapping } from "./column-mapper.ts";
import { parseDate, parseNumber, normalizeStatus, generateRowSignature } from "./value-parsers.ts";
import { calculateComprehensiveFacts } from "./analytics/index.ts";
import { detectAnomalies } from "./anomaly-detector.ts";
import type { SalesLine, Job } from "../types/sales.ts";

export async function processImportSalesJob(job: Job, workerId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { import_run_id, tenant_id, merge_mode, column_mapping } = job.payload;
  
  console.log(`[Worker ${workerId}] Processing import run ${import_run_id}`);

  try {
    // Update status to processing
    await supabaseAdmin
      .from('import_runs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', import_run_id);

    // Fetch import run details
    const { data: importRun, error: runError } = await supabaseAdmin
      .from('import_runs')
      .select('*')
      .eq('id', import_run_id)
      .single();

    if (runError || !importRun) {
      throw new Error(`Import run not found: ${import_run_id}`);
    }

    if (!importRun.file_path) {
      throw new Error('No file path in import run');
    }

    // Download and parse file
    console.log(`[Worker ${workerId}] Downloading file: ${importRun.file_path}`);
    const arrayBuffer = await downloadFile(importRun.file_path);

    console.log(`[Worker ${workerId}] Parsing file...`);
    const allRows = parseExcelFile(arrayBuffer);

    if (allRows.length < 2) {
      throw new Error('File has no data rows');
    }

    // Detect header row
    const { headerRowIndex, headers } = detectHeaderRow(allRows);
    console.log(`[Worker ${workerId}] Header row detected at index: ${headerRowIndex}`);
    console.log(`[Worker ${workerId}] Excel headers:`, headers);
    
    const dataRows = extractDataRows(allRows, headerRowIndex);
    console.log(`[Worker ${workerId}] Found ${dataRows.length} data rows`);
    console.log(`[Worker ${workerId}] First row sample:`, dataRows[0]);

    // Determine column mapping
    let columnMap;
    if (column_mapping && typeof column_mapping === 'object') {
      console.log(`[Worker ${workerId}] Using manual column mapping from user`);
      columnMap = applyUserColumnMapping(column_mapping);
    } else {
      console.log(`[Worker ${workerId}] Auto-detecting column mapping`);
      columnMap = detectColumnMapping(headers, dataRows);
    }
    console.log(`[Worker ${workerId}] Final column mapping:`, columnMap);

    // Process sales lines
    const salesLines: SalesLine[] = [];
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const saleDate = parseDate(row[columnMap.date]);
      
      if (!saleDate) {
        console.log(`[Worker ${workerId}] Skipping row ${i + 2}: invalid date`);
        continue;
      }

      const quantity = parseNumber(row[columnMap.quantity]) || 1;
      const grossValue = parseNumber(row[columnMap.grossValue]) || 0;
      const discountValue = parseNumber(row[columnMap.discountValue]) || 0;
      const netValue = parseNumber(row[columnMap.netValue]) || (grossValue - discountValue);
      const costValue = parseNumber(row[columnMap.costValue]) || 0;

      if (!minDate || saleDate < minDate) minDate = saleDate;
      if (!maxDate || saleDate > maxDate) maxDate = saleDate;

      const saleDateStr = saleDate.toISOString().split('T')[0];
      const skuValue = columnMap.sku !== -1 ? String(row[columnMap.sku] || '') : null;
      const orderIdValue = columnMap.orderId !== -1 ? String(row[columnMap.orderId] || '') : null;
      
      // Generate unique signature
      const rowSignature = await generateRowSignature(
        tenant_id,
        saleDateStr,
        orderIdValue,
        skuValue,
        quantity,
        grossValue
      );

      // Parse and normalize status
      const rawStatus = columnMap.status !== -1 ? String(row[columnMap.status] || '') : null;
      const normalizedStatus = normalizeStatus(rawStatus);

      salesLines.push({
        tenant_id,
        import_run_id,
        sale_date: saleDateStr,
        quantity,
        gross_value: grossValue,
        discount_value: discountValue,
        net_value: netValue,
        cost_value: costValue,
        sku: skuValue,
        product_name: columnMap.productName !== -1 ? String(row[columnMap.productName] || '') : null,
        channel: columnMap.channel !== -1 ? String(row[columnMap.channel] || '') : null,
        customer_name: columnMap.customerName !== -1 ? String(row[columnMap.customerName] || '') : null,
        seller_name: columnMap.sellerName !== -1 ? String(row[columnMap.sellerName] || '') : null,
        order_id: orderIdValue,
        row_signature: rowSignature,
        city: columnMap.city !== -1 ? String(row[columnMap.city] || '') || null : null,
        state: columnMap.state !== -1 ? String(row[columnMap.state] || '') || null : null,
        category: columnMap.category !== -1 ? String(row[columnMap.category] || '') || null : null,
        unit_price: columnMap.unitPrice !== -1 ? parseNumber(row[columnMap.unitPrice]) || null : null,
        tax_value: columnMap.taxValue !== -1 ? parseNumber(row[columnMap.taxValue]) || null : null,
        payment_method: columnMap.paymentMethod !== -1 ? String(row[columnMap.paymentMethod] || '') || null : null,
        status: normalizedStatus
      });
    }

    if (salesLines.length === 0) {
      throw new Error('No valid sales lines found in file');
    }

    // Insert sales lines
    console.log(`[Worker ${workerId}] Inserting ${salesLines.length} sales lines... (merge_mode: ${merge_mode})`);
    const batchSize = 250;
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < salesLines.length; i += batchSize) {
      const batch = salesLines.slice(i, i + batchSize);
      
      // Progress checkpoint every 1000 lines
      if (i > 0 && i % 1000 === 0) {
        console.log(`[Worker ${workerId}] Progress: ${i}/${salesLines.length} lines processed`);
        await supabaseAdmin
          .from('import_runs')
          .update({ 
            error_message: `Processando: ${i}/${salesLines.length} linhas`,
            updated_at: new Date().toISOString()
          })
          .eq('id', import_run_id);
      }
      
      if (merge_mode) {
        // In merge mode, use upsert with ON CONFLICT DO NOTHING
        for (const line of batch) {
          const { error: insertError } = await supabaseAdmin
            .from('sales_lines')
            .upsert(line, { 
              onConflict: 'tenant_id,row_signature',
              ignoreDuplicates: true 
            });

          if (insertError) {
            if (insertError.code === '23505') {
              skippedCount++;
              continue;
            }
            throw new Error(`Failed to insert sales line: ${insertError.message}`);
          }
          insertedCount++;
        }
      } else {
        // Normal insert with upsert fallback to handle orphan duplicates
        const { error: insertError } = await supabaseAdmin
          .from('sales_lines')
          .upsert(batch, { 
            onConflict: 'tenant_id,row_signature',
            ignoreDuplicates: true 
          });

        if (insertError) {
          throw new Error(`Failed to insert sales lines: ${insertError.message}`);
        }
        insertedCount += batch.length;
      }
    }
    
    console.log(`[Worker ${workerId}] Inserted ${insertedCount} lines, skipped ${skippedCount} duplicates`);

    // Calculate analytics
    console.log(`[Worker ${workerId}] Calculating analytics...`);
    const facts = calculateComprehensiveFacts(salesLines, minDate, maxDate);

    console.log(`[Worker ${workerId}] Creating run facts...`);
    await supabaseAdmin
      .from('run_facts')
      .insert({
        tenant_id,
        import_run_id,
        facts
      });

    // Detect anomalies
    const anomalies = detectAnomalies(salesLines, tenant_id, import_run_id);
    if (anomalies.length > 0) {
      console.log(`[Worker ${workerId}] Found ${anomalies.length} anomalies`);
      await supabaseAdmin
        .from('anomalies')
        .insert(anomalies);
    }

    // Update import run as completed
    await supabaseAdmin
      .from('import_runs')
      .update({
        status: 'done',
        processed_at: new Date().toISOString(),
        detected_start_date: minDate?.toISOString().split('T')[0],
        detected_end_date: maxDate?.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', import_run_id);

    console.log(`[Worker ${workerId}] Import run ${import_run_id} completed successfully`);

  } catch (err) {
    const error = err as Error;
    console.error(`[Worker ${workerId}] Import failed:`, error);

    await supabaseAdmin
      .from('import_runs')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', import_run_id);

    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'failed',
        last_error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    throw error;
  }
}
