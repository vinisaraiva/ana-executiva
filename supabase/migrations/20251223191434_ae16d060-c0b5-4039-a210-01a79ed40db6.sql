-- Update the create_owner_membership function to use SECURITY DEFINER
-- This allows the trigger to bypass RLS when creating the owner membership
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.tenant_memberships (tenant_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (tenant_id, user_id) do nothing;
  return new;
end;
$$;