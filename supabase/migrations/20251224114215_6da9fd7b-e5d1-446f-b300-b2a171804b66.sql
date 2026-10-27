-- Create unique index on sales_lines for deduplication
-- The signature will be a hash of tenant_id + sale_date + order_id + sku + quantity + gross_value
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_lines_unique_signature 
ON public.sales_lines (tenant_id, row_signature) 
WHERE row_signature IS NOT NULL;

-- Add comment explaining the index purpose
COMMENT ON INDEX idx_sales_lines_unique_signature IS 'Unique index for deduplication of sales lines across import runs';

-- Create RLS policy to allow admins/creators to deactivate import runs
DROP POLICY IF EXISTS "runs_delete_admin_or_creator" ON public.import_runs;

-- Allow soft delete (update is_active to false) for admins or creators
-- Policy already exists for update, but let's ensure it covers is_active updates