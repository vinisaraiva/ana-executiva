-- 1. Permitir platform admins verem todos os tenants
CREATE POLICY "tenants_select_platform_admin"
ON public.tenants
FOR SELECT
USING (is_platform_admin());

-- 2. Permitir platform admins verem todas as memberships
CREATE POLICY "memberships_select_platform_admin"
ON public.tenant_memberships
FOR SELECT
USING (is_platform_admin());