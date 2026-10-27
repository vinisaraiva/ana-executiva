-- Índices para melhor performance com 10+ usuários simultâneos

-- Índice para queries do chat por tenant e data
CREATE INDEX IF NOT EXISTS idx_sales_lines_tenant_date ON public.sales_lines (tenant_id, sale_date);

-- Índice para deletes e joins por import_run_id
CREATE INDEX IF NOT EXISTS idx_sales_lines_import_run ON public.sales_lines (import_run_id);

-- Índice para fetch de anomalias
CREATE INDEX IF NOT EXISTS idx_anomalies_import_run ON public.anomalies (import_run_id);

-- Índice para worker queue
CREATE INDEX IF NOT EXISTS idx_jobs_status_available ON public.jobs (status, available_at) WHERE status = 'queued';

-- Índice para listagem de import_runs
CREATE INDEX IF NOT EXISTS idx_import_runs_tenant_active ON public.import_runs (tenant_id, is_active);

-- Coluna de auditoria para rastrear ações de overlap
ALTER TABLE public.import_runs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;