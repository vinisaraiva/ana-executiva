import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { Loader2 } from 'lucide-react';
import { CreateTenantForm } from '@/components/tenant/CreateTenantForm';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tenant, tenants, loading: tenantLoading } = useTenant();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show onboarding if no tenants
  if (tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <CreateTenantForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-64">
        <AppHeader title={title} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
