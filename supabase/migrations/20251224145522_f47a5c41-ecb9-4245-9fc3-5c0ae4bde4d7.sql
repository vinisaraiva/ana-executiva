-- Create platform_settings table for global platform configuration
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only platform admins can SELECT
CREATE POLICY "platform_settings_select_admin" 
ON public.platform_settings 
FOR SELECT 
USING (is_platform_admin());

-- Only platform admins can INSERT
CREATE POLICY "platform_settings_insert_admin" 
ON public.platform_settings 
FOR INSERT 
WITH CHECK (is_platform_admin());

-- Only platform admins can UPDATE
CREATE POLICY "platform_settings_update_admin" 
ON public.platform_settings 
FOR UPDATE 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Only platform admins can DELETE
CREATE POLICY "platform_settings_delete_admin" 
ON public.platform_settings 
FOR DELETE 
USING (is_platform_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Insert default AI prompt settings
INSERT INTO public.platform_settings (key, value)
VALUES (
  'ai_prompt_settings',
  '{
    "base_system_prompt": "Você é um gestor financeiro sênior de grandes empresas, especialista em análise de dados financeiros com mais de 20 anos de experiência. Sua missão é ajudar gestores a tomar decisões melhores baseadas em dados.",
    "personalities": {
      "profissional": "Você é um gestor financeiro experiente e objetivo.",
      "amigável": "Você é um consultor amigável e acessível que explica de forma simples.",
      "técnico": "Você é um analista técnico detalhista e preciso.",
      "executivo": "Você é um consultor executivo direto e focado em resultados."
    }
  }'::jsonb
);