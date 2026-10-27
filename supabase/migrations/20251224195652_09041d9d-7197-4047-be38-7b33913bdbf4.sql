-- Tabela para registrar histórico de ações administrativas
CREATE TABLE public.admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Apenas platform admins podem ver logs
CREATE POLICY "admin_actions_select_platform_admin" ON public.admin_actions_log
FOR SELECT USING (is_platform_admin());

-- Apenas platform admins podem inserir logs
CREATE POLICY "admin_actions_insert_platform_admin" ON public.admin_actions_log
FOR INSERT WITH CHECK (is_platform_admin());

-- Criar índice para busca por tenant
CREATE INDEX idx_admin_actions_tenant_id ON public.admin_actions_log(tenant_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions_log(created_at DESC);