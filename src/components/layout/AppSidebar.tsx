import { Link, useLocation } from "react-router-dom";
import { CalendarClock, Inbox, LayoutDashboard, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";

const links = [
  { to: "/app", title: "Visão geral", icon: LayoutDashboard },
  { to: "/app/emails", title: "Correspondências", icon: Inbox },
  { to: "/app/briefings", title: "Briefings", icon: CalendarClock },
  { to: "/app/settings", title: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { isPlatformAdmin } = usePlatformAdmin();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <Link to="/app" className="flex items-center gap-3 border-b p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sparkles size={23} /></span>
        <span><strong className="block text-lg">Ana Executiva</strong><small className="text-muted-foreground">Sua assistente digital</small></span>
      </Link>
      <nav className="flex-1 space-y-1 p-4">
        {links.map(({to,title,icon:Icon}) => (
          <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",location.pathname===to ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent")}>
            <Icon size={19}/>{title}
          </Link>
        ))}
      </nav>
      {isPlatformAdmin && <Link to="/admin" className="mx-4 mb-3 flex items-center gap-3 rounded-xl p-3 text-sm hover:bg-sidebar-accent"><ShieldCheck size={18}/>Administração (legado)</Link>}
      <div className="border-t p-4 text-xs text-muted-foreground">Ambiente em preparação. Nenhum e-mail será enviado sem sua aprovação.</div>
    </aside>
  );
}
