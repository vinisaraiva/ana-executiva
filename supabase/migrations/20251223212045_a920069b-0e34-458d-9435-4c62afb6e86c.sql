-- Limpeza completa para nova importação

-- 1. Deletar anomalias
DELETE FROM anomalies;

-- 2. Deletar fatos
DELETE FROM run_facts;

-- 3. Deletar linhas de vendas
DELETE FROM sales_lines;

-- 4. Deletar jobs
DELETE FROM jobs;

-- 5. Deletar import runs
DELETE FROM import_runs;

-- 6. Deletar arquivos do storage
DELETE FROM storage.objects WHERE bucket_id = 'imports';