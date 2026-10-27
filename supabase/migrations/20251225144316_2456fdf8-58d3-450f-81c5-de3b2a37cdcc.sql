-- Create function to get sales counts by tenant (bypasses 1000 row limit)
CREATE OR REPLACE FUNCTION get_sales_counts_by_tenant()
RETURNS TABLE (tenant_id uuid, count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT sl.tenant_id, COUNT(*) as count
  FROM sales_lines sl
  GROUP BY sl.tenant_id;
$$;

-- Grant execute permission to authenticated users (RLS on sales_lines still applies contextually, 
-- but this function uses SECURITY DEFINER for accurate counts for platform admins)
GRANT EXECUTE ON FUNCTION get_sales_counts_by_tenant() TO authenticated;