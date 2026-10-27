/**
 * Sales data types for the import process
 */

export interface SalesLine {
  tenant_id: string;
  import_run_id: string;
  sale_date: string;
  quantity: number;
  gross_value: number;
  discount_value: number;
  net_value: number;
  cost_value: number;
  sku: string | null;
  product_name: string | null;
  channel: string | null;
  customer_name: string | null;
  seller_name: string | null;
  order_id: string | null;
  row_signature: string;
  city: string | null;
  state: string | null;
  category: string | null;
  unit_price: number | null;
  tax_value: number | null;
  payment_method: string | null;
  status: string | null;
}

export interface ColumnMapping {
  date: number;
  quantity: number;
  grossValue: number;
  discountValue: number;
  netValue: number;
  costValue: number;
  sku: number;
  productName: number;
  channel: number;
  customerName: number;
  sellerName: number;
  orderId: number;
  city: number;
  state: number;
  category: number;
  unitPrice: number;
  taxValue: number;
  paymentMethod: number;
  status: number;
}

export interface Job {
  id: string;
  type: string;
  tenant_id: string;
  payload: {
    import_run_id: string;
    tenant_id: string;
    merge_mode?: boolean;
    column_mapping?: Record<string, number>;
  };
  status: string;
  attempts: number;
  locked_by: string | null;
  locked_at: string | null;
}

export interface ImportRun {
  id: string;
  tenant_id: string;
  file_path: string | null;
  original_filename: string | null;
  status: string;
  detected_start_date: string | null;
  detected_end_date: string | null;
  error_message: string | null;
}

export interface Anomaly {
  tenant_id: string;
  import_run_id: string;
  code: string;
  title: string;
  severity: 'info' | 'warning' | 'error';
  details: Record<string, any>;
}

export interface HeaderDetectionResult {
  headerRowIndex: number;
  headers: string[];
}
