import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { if (!authLoading && user) navigate("/app", {replace:true}); }, [authLoading, user, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setError("");setNotice("");
    try {
      const result = isRegistering
        ? await signUp(email.trim(), password, {first_name:firstName.trim(),last_name:lastName.trim()})
        : await signIn(email.trim(),password);
      if (result.error) { setError(result.error.message); return; }
      if (isRegistering) setNotice("Cadastro solicitado. Confira seu e-mail para confirmar a conta, se necessário.");
      else navigate("/app");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível completar a solicitação.");
    } finally {setBusy(false);}
  }

  return <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
    <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lg">
      <Link to="/" className="mb-8 flex items-center gap-2 text-xl font-bold"><Sparkles className="text-primary"/>Ana Executiva</Link>
      <h1 className="mb-2 text-2xl font-bold">{isRegistering ? "Criar minha conta" : "Bem-vindo de volta"}</h1>
      <p className="mb-7 text-sm text-muted-foreground">Acesso à plataforma de assistência executiva.</p>
      <form onSubmit={submit} className="space-y-4">
        {isRegistering && <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm">Nome<Input value={firstName} onChange={e=>setFirstName(e.target.value)} required minLength={2}/></label><label className="space-y-1 text-sm">Sobrenome<Input value={lastName} onChange={e=>setLastName(e.target.value)} required minLength={2}/></label></div>}
        <label className="block space-y-1 text-sm">E-mail<Input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
        <label className="block space-y-1 text-sm">Senha<Input type="password" minLength={6} autoComplete={isRegistering?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
        {error && <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {notice && <div role="status" className="rounded-xl bg-muted p-3 text-sm">{notice}</div>}
        <Button className="w-full" disabled={busy || authLoading} type="submit">{busy ? <Loader2 size={16} className="mr-2 animate-spin"/> : <LockKeyhole size={16} className="mr-2"/>}{isRegistering?"Solicitar cadastro":"Entrar"}</Button>
      </form>
      <button type="button" className="mt-5 w-full text-center text-sm text-primary hover:underline" onClick={()=>{setIsRegistering(!isRegistering);setError("");setNotice("");}}>{isRegistering?"Já tenho uma conta":"Ainda não tenho uma conta"}</button>
      <p className="mt-6 text-center text-xs text-muted-foreground">As integrações com Gmail e WhatsApp serão ativadas após a configuração do ambiente exclusivo da Ana.</p>
    </div>
  </div>;
}
