-- Adicionar vinicius_saraiva@ifba.edu.br como platform admin
INSERT INTO public.platform_admins (user_id)
VALUES ('3219b7ac-2292-4f4e-b47c-699e25e2b661')
ON CONFLICT (user_id) DO NOTHING;