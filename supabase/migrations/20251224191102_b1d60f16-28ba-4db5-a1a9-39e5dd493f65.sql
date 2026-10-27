-- Drop the restrictive update policy and add one for platform admins
DROP POLICY IF EXISTS "jobs_update_none" ON public.jobs;

CREATE POLICY "jobs_update_platform_admin" 
ON public.jobs 
FOR UPDATE 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());