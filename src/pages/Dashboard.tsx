import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowRight, CalendarClock, Inbox, MessageCircle, ShieldCheck } from "lucide-react";
const items = [
  {to:"/app/emails",icon:Inbox,title:"Correspondências",text:"A conexão Gmail ainda será configurada no Supabase exclusivo da Ana."},
  {to:"/app/briefings",icon:CalendarClock,title:"Briefing diário",text:"Configure futuramente o horário e as prioridades que você deseja acompanhar."},
  {to:"/app/settings",icon:ShieldCheck,title:"Preferências e segurança",text:"Ajustes de conta, aprovação humana e integrações em preparação."},
];
export default function Dashboard(){
  return <AppLayout title="Visão geral">
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="rounded-3xl bg-primary p-8 text-primary-foreground"><p className="mb-2 text-sm opacity-80">Ana Executiva</p><h1 className="mb-3 text-3xl font-bold">Seu espaço de trabalho está tomando forma.</h1><p className="max-w-2xl text-sm opacity-90">Esta é a primeira versão da interface. Ainda não há integração ativa com e-mails e não exibimos dados fictícios como se fossem reais.</p></div>
      <div className="grid gap-5 md:grid-cols-3">{items.map(({to,icon:Icon,title,text})=><Link to={to} key={to} className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"><Icon className="mb-5 text-primary"/><h2 className="mb-3 font-semibold">{title}</h2><p className="min-h-20 text-sm text-muted-foreground">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">Abrir <ArrowRight size={15}/></span></Link>)}</div>
      <div className="flex items-start gap-3 rounded-2xl border p-5"><MessageCircle className="mt-1 shrink-0 text-primary"/><div><h3 className="font-semibold">WhatsApp como canal principal</h3><p className="mt-1 text-sm text-muted-foreground">O código do webhook foi reaproveitado do GeFIN, mas precisa de revisão de segurança, adaptação dos comandos e implantação em um ambiente isolado antes da ativação.</p></div></div>
    </div>
  </AppLayout>;
}
