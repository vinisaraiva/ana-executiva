-- Clean data again for reimport with fixed header detection
DELETE FROM anomalies WHERE import_run_id IN (
  '78828a23-4b22-41c8-afbf-1e61c742cf12',
  'aad1aeb4-5b42-41c8-9f76-67061e392f17'
);

DELETE FROM run_facts WHERE import_run_id IN (
  '78828a23-4b22-41c8-afbf-1e61c742cf12',
  'aad1aeb4-5b42-41c8-9f76-67061e392f17'
);

DELETE FROM sales_lines WHERE import_run_id IN (
  '78828a23-4b22-41c8-afbf-1e61c742cf12',
  'aad1aeb4-5b42-41c8-9f76-67061e392f17'
);

UPDATE import_runs 
SET status = 'queued', 
    error_message = NULL, 
    processed_at = NULL,
    detected_start_date = NULL,
    detected_end_date = NULL,
    updated_at = now()
WHERE id IN (
  '78828a23-4b22-41c8-afbf-1e61c742cf12',
  'aad1aeb4-5b42-41c8-9f76-67061e392f17'
);

UPDATE jobs 
SET status = 'queued', 
    attempts = 0, 
    locked_at = NULL, 
    locked_by = NULL, 
    last_error = NULL,
    available_at = now(),
    updated_at = now()
WHERE payload->>'import_run_id' IN (
  '78828a23-4b22-41c8-afbf-1e61c742cf12',
  'aad1aeb4-5b42-41c8-9f76-67061e392f17'
);