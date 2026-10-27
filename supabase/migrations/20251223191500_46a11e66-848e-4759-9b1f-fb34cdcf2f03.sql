-- Fix search_path for is_member function
CREATE OR REPLACE FUNCTION public.is_member(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = _tenant_id
      and tm.user_id = auth.uid()
  );
$$;

-- Fix search_path for is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = _tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner','admin')
  );
$$;

-- Fix search_path for is_owner function
CREATE OR REPLACE FUNCTION public.is_owner(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = _tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
  );
$$;

-- Fix search_path for set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;