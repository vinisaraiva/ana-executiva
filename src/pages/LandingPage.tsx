import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CheckCircle2, Mail, MessageCircle, Mic, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {icon: Mail, title:"Correspondências organizadas", description:"Encontre mensagens, acompanhe assuntos e veja o que merece atenção."},
  {icon: Mic, title:"Converse por áudio", description:"Dite orientações em linguagem natural, sem precisar digitar tudo."},
  {icon: ShieldCheck, title:"Você aprova cada envio", description:"A Ana prepara rascunhos; a decisão de enviar continua sendo sua."},
  {icon: CalendarClock, title:"Briefing no seu horário", description:"Uma visão objetiva das prioridades e pendências, quando você escolher."},
];

export default function LandingPage() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold"><Sparkles className="text-primary"/>Ana Executiva</Link>
      <Link to="/login" className="rounded-xl border px-5 py-2 text-sm font-medium hover:bg-muted">Acessar</Link>
    </header>
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-20 md:grid-cols-2">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">Assistência executiva com inteligência artificial</div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">Sua secretária executiva, <span className="text-primary">direto no WhatsApp.</span></h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">A Ana foi pensada para ajudar você a acompanhar e-mails, identificar prioridades e preparar respostas no seu estilo — por texto ou áudio, com aprovação antes de enviar.</p>
          <div className="flex flex-wrap gap-3"><Link className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground" to="/login">Conhecer a plataforma <ArrowRight size={18}/></Link></div>
          <p className="text-xs text-muted-foreground">Plataforma em desenvolvimento. Gmail e briefings ainda dependem de integração.</p>
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-xl">
          <div className="mb-5 flex items-center gap-3 border-b pb-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10"><MessageCircle className="text-primary"/></span><div><strong className="block">Conversa ilustrativa</strong><span className="text-xs text-muted-foreground">Como será a experiência com a Ana</span></div></div>
          <div className="space-y-4 text-sm">
            <div className="ml-8 rounded-2xl rounded-tr-sm bg-primary/10 p-4">Ana, quais e-mails precisam da minha atenção hoje?</div>
            <div className="mr-8 rounded-2xl rounded-tl-sm bg-muted p-4">Bom dia! Posso reunir suas mensagens prioritárias, os prazos e os assuntos aguardando resposta.</div>
            <div className="ml-8 rounded-2xl rounded-tr-sm bg-primary/10 p-4">Prepare uma resposta formal para o relatório. <Mic size={15} className="ml-2 inline"/></div>
            <div className="mr-8 rounded-2xl rounded-tl-sm border p-4">Preparo um rascunho no seu estilo e mostro para aprovação antes do envio. <CheckCircle2 size={15} className="ml-2 inline text-primary"/></div>
          </div>
        </div>
      </section>
      <section className="bg-muted/50 py-20"><div className="mx-auto max-w-6xl px-6"><h2 className="mb-4 text-3xl font-bold">Mais tempo para decidir. Menos tempo na caixa de entrada.</h2><p className="mb-10 text-muted-foreground">Uma experiência desenvolvida para quem administra equipes, instituições e decisões importantes.</p><div className="grid gap-5 md:grid-cols-4">{features.map(({icon:Icon,title,description})=><div className="rounded-2xl border bg-card p-5" key={title}><Icon className="mb-5 text-primary"/><h3 className="mb-2 font-semibold">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div>)}</div></div></section>
      <section className="mx-auto max-w-6xl px-6 py-16 text-center"><h2 className="text-3xl font-bold">A Ana trabalha com você, não no seu lugar.</h2><p className="mt-4 text-muted-foreground">Segurança, contexto e aprovação humana desde o primeiro dia.</p></section>
    </main>
    <footer className="border-t px-6 py-8 text-center text-xs text-muted-foreground">© Ana Executiva · <Link to="/privacidade" className="underline">Privacidade</Link> · <Link to="/termos" className="underline">Termos</Link></footer>
  </div>;
}
