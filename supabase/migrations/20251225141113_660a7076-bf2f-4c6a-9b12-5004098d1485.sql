-- Backfill missing profiles for users who signed up before the trigger existed
INSERT INTO public.profiles (id, first_name, last_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'last_name', '')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
