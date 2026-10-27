-- Add new columns to sales_lines for city, state, category, unit_price, tax_value, and payment_method
ALTER TABLE public.sales_lines 
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
  ADD COLUMN IF NOT EXISTS tax_value NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;