-- Permitir platform admins verem todas as importações
CREATE POLICY "runs_select_platform_admin"
ON public.import_runs
FOR SELECT
USING (is_platform_admin());

-- Permitir platform admins verem todas as linhas de vendas
CREATE POLICY "sales_select_platform_admin"
ON public.sales_lines
FOR SELECT
USING (is_platform_admin());