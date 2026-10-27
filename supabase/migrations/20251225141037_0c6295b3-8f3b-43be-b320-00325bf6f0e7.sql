-- Allow platform admins (SaaS admins) to read user names in public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_platform_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_platform_admin());
