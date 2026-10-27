-- Create sectors table for admin-manageable sectors
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Everyone can read sectors
CREATE POLICY "sectors_select_all"
  ON public.sectors FOR SELECT
  USING (true);

-- Only platform admins can manage sectors
CREATE POLICY "sectors_insert_admin"
  ON public.sectors FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "sectors_update_admin"
  ON public.sectors FOR UPDATE
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "sectors_delete_admin"
  ON public.sectors FOR DELETE
  USING (is_platform_admin());

-- Insert initial sectors
INSERT INTO public.sectors (name) VALUES
  ('Comércio'),
  ('Serviços'),
  ('Indústria'),
  ('Tecnologia'),
  ('Alimentação'),
  ('Saúde'),
  ('Educação'),
  ('Outro');