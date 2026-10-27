-- Create enum type for audit actions
CREATE TYPE audit_action AS ENUM (
  'login_success',
  'login_failed', 
  'logout',
  'signup',
  'access_denied',
  'file_upload',
  'file_delete',
  'chat_request',
  'tenant_created',
  'tenant_updated',
  'membership_changed',
  'import_created',
  'import_deleted',
  'settings_updated'
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Action and severity
  action audit_action NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Who (can be null for anonymous attempts)
  user_id uuid,
  user_email text,
  
  -- Context (optional)
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  
  -- Technical details
  ip_address inet,
  user_agent text,
  
  -- Flexible extra data
  details jsonb DEFAULT '{}',
  
  -- Result
  success boolean DEFAULT true,
  error_message text
);

-- Indexes for security queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all logs
CREATE POLICY "audit_select_platform_admin" ON public.audit_logs
  FOR SELECT USING (is_platform_admin());

-- No direct inserts by users (only via service role/RPC)
CREATE POLICY "audit_insert_none" ON public.audit_logs
  FOR INSERT WITH CHECK (false);

-- Nobody can update (immutability)
CREATE POLICY "audit_update_none" ON public.audit_logs
  FOR UPDATE USING (false);

-- Nobody can delete (immutability)
CREATE POLICY "audit_delete_none" ON public.audit_logs
  FOR DELETE USING (false);

-- Create SECURITY DEFINER function for Edge Functions to use
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action audit_action,
  _severity text DEFAULT 'info',
  _user_id uuid DEFAULT NULL,
  _user_email text DEFAULT NULL,
  _tenant_id uuid DEFAULT NULL,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _details jsonb DEFAULT '{}',
  _success boolean DEFAULT true,
  _error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    action, severity, user_id, user_email, tenant_id, 
    ip_address, user_agent, details, success, error_message
  ) VALUES (
    _action, _severity, _user_id, _user_email, _tenant_id,
    _ip_address, _user_agent, _details, _success, _error_message
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;