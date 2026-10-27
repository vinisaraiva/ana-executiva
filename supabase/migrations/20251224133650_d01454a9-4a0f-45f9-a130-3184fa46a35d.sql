-- Permitir DELETE em import_runs para admin ou criador
CREATE POLICY "runs_delete_admin_or_creator" 
ON public.import_runs 
FOR DELETE 
USING (is_admin(tenant_id) OR (created_by = auth.uid()));

-- Permitir DELETE em sales_lines para admin ou membro
DROP POLICY IF EXISTS "sales_delete_none" ON public.sales_lines;
CREATE POLICY "sales_delete_member" 
ON public.sales_lines 
FOR DELETE 
USING (is_member(tenant_id));

-- Permitir DELETE em run_facts para membro
DROP POLICY IF EXISTS "facts_insert_none" ON public.run_facts;
CREATE POLICY "facts_delete_member" 
ON public.run_facts 
FOR DELETE 
USING (is_member(tenant_id));

-- Permitir DELETE em anomalies para membro
CREATE POLICY "anomalies_delete_member" 
ON public.anomalies 
FOR DELETE 
USING (is_member(tenant_id));