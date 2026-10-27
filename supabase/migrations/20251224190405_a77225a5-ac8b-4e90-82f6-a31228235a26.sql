-- Drop the restrictive select policy and add one for platform admins
DROP POLICY IF EXISTS "jobs_select_none" ON public.jobs;

CREATE POLICY "jobs_select_platform_admin" 
ON public.jobs 
FOR SELECT 
USING (is_platform_admin());

-- Enable realtime for jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;