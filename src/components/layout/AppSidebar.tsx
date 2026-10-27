/**
 * @fileoverview Sidebar do Aplicativo - DrGeFin
 * 
 * Barra lateral de navegação da aplicação, contendo logo,
 * seletor de empresa, menu de navegação principal, medidores
 * de uso e links administrativos (para admins da plataforma).
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Upload, MessageSquare, Settings, Building2, ChevronDown, ShieldCheck, Activity, MessageCircle } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UsageMeter } from '@/components/UsageMeter';
import gefeinMascotBust from '@/assets/gefin-mascot-bust.png';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Itens de navegação principal da sidebar.
 */
const navItems = [
  { href: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/app/imports', icon: Upload, label: 'Importações' },
  { href: '/app/chat', icon: MessageSquare, label: 'Chat IA' },
];

export function AppSidebar() {
  const location = useLocation();
  const { tenant, tenants, selectTenant } = useTenant();
  const { isPlatformAdmin } = usePlatformAdmin();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex flex-col items-center text-center group">
          {/* Mascote Grande com Borda */}
          <div className="relative mb-3">
            <div className="rounded-full p-2 bg-white/50 border-2 border-sidebar-primary/20 group-hover:border-sidebar-primary/40 transition-all duration-300">
              <img 
                src={gefeinMascotBust} 
                alt="Dr. GeFin" 
                className="h-40 w-40 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          {/* Nome e Subtítulo Centralizados */}
          <h1 className="font-bold text-xl text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
            DrGeFin
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">
            Gestor Financeiro
          </p>
        </div>
      </div>

      {/* Tenant Selector */}
      {tenants.length > 0 && (
        <div className="p-4 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 p-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-all duration-200 hover:shadow-md border border-transparent hover:border-sidebar-primary/20">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 flex-shrink-0 text-sidebar-primary" />
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {tenant?.name || 'Selecionar empresa'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-sidebar-foreground/60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {tenants.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => selectTenant(t.id)}
                  className={cn(t.id === tenant?.id && 'bg-accent')}
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/app' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform",
                !isActive && "group-hover:scale-110"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Usage Meters */}
      {tenant?.id && (
        <div className="px-4 pb-2 space-y-2">
          <UsageMeter tenantId={tenant.id} type="messages" className="text-sidebar-foreground" />
          <UsageMeter tenantId={tenant.id} type="imports" className="text-sidebar-foreground" />
        </div>
      )}

      {/* WhatsApp Button */}
      <div className="px-4 pb-2">
        <a
          href="https://wa.me/5573991840832?text=Olá%20GeFin!%20Quero%20começar%20a%20usar."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 hover:text-green-700 transition-all duration-200 group border border-green-500/20 hover:border-green-500/40"
        >
          <MessageCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="font-medium text-sm">Fale pelo WhatsApp</span>
        </a>
      </div>

      {/* Bottom Links */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {/* Admin Links - Only for platform admins */}
        {isPlatformAdmin && (
          <>
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                location.pathname === '/admin'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
              )}
            >
              <ShieldCheck className={cn(
                "h-5 w-5 transition-transform",
                location.pathname !== '/admin' && "group-hover:scale-110"
              )} />
              <span className="font-medium">Administração</span>
            </Link>
            <Link
              to="/admin/jobs"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                location.pathname === '/admin/jobs'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
              )}
            >
              <Activity className={cn(
                "h-5 w-5 transition-transform",
                location.pathname !== '/admin/jobs' && "group-hover:scale-110"
              )} />
              <span className="font-medium">Jobs</span>
            </Link>
          </>
        )}
        
        {/* Settings */}
        <Link
          to="/app/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
            location.pathname === '/app/settings'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
              : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
          )}
        >
          <Settings className={cn(
            "h-5 w-5 transition-transform",
            location.pathname !== '/app/settings' && "group-hover:scale-110"
          )} />
          <span className="font-medium">Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
