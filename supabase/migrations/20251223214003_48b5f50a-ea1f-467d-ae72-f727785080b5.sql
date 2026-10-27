-- 1. Tabela de admins da plataforma (super admins)
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = auth.uid()
  );
$$;

-- RLS: Apenas platform admins podem ver/gerenciar
CREATE POLICY "platform_admins_select" ON public.platform_admins
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "platform_admins_insert" ON public.platform_admins
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "platform_admins_delete" ON public.platform_admins
  FOR DELETE USING (is_platform_admin());

-- 2. Tabela de assinaturas dos tenants
CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: Platform admins podem tudo, owners podem ver o próprio
CREATE POLICY "subscriptions_select_admin" ON public.tenant_subscriptions
  FOR SELECT USING (is_platform_admin() OR is_owner(tenant_id));

CREATE POLICY "subscriptions_insert_admin" ON public.tenant_subscriptions
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "subscriptions_update_admin" ON public.tenant_subscriptions
  FOR UPDATE USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE POLICY "subscriptions_delete_admin" ON public.tenant_subscriptions
  FOR DELETE USING (is_platform_admin());

-- Trigger para updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Tabela de configurações do chat IA
CREATE TABLE public.chat_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  ai_name TEXT NOT NULL DEFAULT 'Assistente Financeiro',
  ai_personality TEXT NOT NULL DEFAULT 'profissional',
  tone TEXT NOT NULL DEFAULT 'formal',
  use_emojis BOOLEAN NOT NULL DEFAULT true,
  use_markdown_headers BOOLEAN NOT NULL DEFAULT false,
  use_icons BOOLEAN NOT NULL DEFAULT true,
  custom_instructions TEXT,
  greeting_message TEXT,
  quick_suggestions JSONB DEFAULT '["Qual foi meu faturamento?", "Quais alertas devo verificar?", "Como estão minhas vendas?"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Membros podem ver, admins podem editar
CREATE POLICY "chat_settings_select_member" ON public.chat_settings
  FOR SELECT USING (is_member(tenant_id));

CREATE POLICY "chat_settings_insert_admin" ON public.chat_settings
  FOR INSERT WITH CHECK (is_admin(tenant_id));

CREATE POLICY "chat_settings_update_admin" ON public.chat_settings
  FOR UPDATE USING (is_admin(tenant_id)) WITH CHECK (is_admin(tenant_id));

-- Trigger para updated_at
CREATE TRIGGER update_chat_settings_updated_at
  BEFORE UPDATE ON public.chat_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();