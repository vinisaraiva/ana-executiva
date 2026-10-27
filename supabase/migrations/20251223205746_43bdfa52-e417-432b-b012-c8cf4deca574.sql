-- Fix stuck job: change type from process_import to import_sales
UPDATE jobs 
SET type = 'import_sales', updated_at = now() 
WHERE type = 'process_import' AND status = 'queued';