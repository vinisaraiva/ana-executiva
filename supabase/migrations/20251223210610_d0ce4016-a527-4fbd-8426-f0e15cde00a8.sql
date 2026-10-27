-- Fix stuck import_runs: change status from processing to done
UPDATE import_runs 
SET status = 'done', updated_at = now() 
WHERE status = 'processing' 
  AND id IN ('78828a23-4b22-41c8-afbf-1e61c742cf12', 'aad1aeb4-5b42-41c8-9f76-67061e392f17');