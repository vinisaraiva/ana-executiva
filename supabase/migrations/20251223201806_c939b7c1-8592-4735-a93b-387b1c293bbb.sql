-- Add seller_name column to sales_lines for seller analytics
ALTER TABLE public.sales_lines ADD COLUMN seller_name TEXT;