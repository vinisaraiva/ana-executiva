/**
 * @fileoverview Página de Login/Cadastro - DrGeFin
 * 
 * Página de autenticação que permite:
 * - Login de usuários existentes
 * - Cadastro de novos usuários com seleção de plano
 * - Validação de formulários com Zod
 * - Redirecionamento automático após autenticação
 * 
 * Integra com Supabase Auth para gerenciamento de sessões.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import mascotBust from '@/assets/gefin-mascot-bust.png';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema de validação para login.
 * Requer email válido e senha com mínimo de 6 caracteres.
 */
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

/**
 * Schema de validação para cadastro.
 * Estende o schema de login com nome e sobrenome.
 */
const signupSchema = loginSchema.extend({
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres').max(50),
});

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um plano disponível para seleção no cadastro.
 */
interface LandingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number | null;
  features: string[];
  highlight: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de autenticação do DrGeFin.
 * 
 * Permite alternar entre modos de login e cadastro.
 * No modo cadastro, o usuário pode selecionar o plano desejado.
 */
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Plano selecionado via URL (ex: /login?plan=pro)
  const planFromUrl = searchParams.get('plan');
  
  // Hooks de autenticação
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  
  // Estados do formulário
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(planFromUrl);
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  // Busca planos disponíveis para exibir no seletor de cadastro
  const { data: plans } = useQuery({
    queryKey: ['landing-plans-login'],
    queryFn: async (): Promise<LandingPlan[]> => {
      const { data, error } = await supabase
        .from('landing_plans')
        .select('id, name, slug, description, price_monthly, features, highlight')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Garante que features seja sempre um array
      return (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
    }
  });

  // Define plano padrão quando os planos são carregados
  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlan) {
      const urlPlan = plans.find(p => p.slug === planFromUrl);
      setSelectedPlan(urlPlan?.slug || plans[0].slug);
    }
  }, [plans, planFromUrl, selectedPlan]);

  // Redireciona usuário já autenticado para o app
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/app');
    }
  }, [user, authLoading, navigate]);

  // Plano atualmente selecionado para exibição
  const currentPlan = plans?.find(p => p.slug === selectedPlan);

  /**
   * Formata preço para exibição.
   * @param price - Preço mensal (null ou 0 = Grátis)
   */
  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  /**
   * Processa o submit do formulário de login/cadastro.
   * Valida os dados e chama a função apropriada do Auth.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida os dados do formulário com Zod
    const schema = isLogin ? loginSchema : signupSchema;
    const dataToValidate = isLogin 
      ? { email, password } 
      : { email, password, firstName, lastName };
    
    const validation = schema.safeParse(dataToValidate);
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        // Processo de login
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({ title: 'Erro', description: 'Email ou senha incorretos', variant: 'destructive' });
          } else {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
          }
        } else {
          navigate('/app');
        }
      } else {
        // Processo de cadastro - inclui plano selecionado nos metadados
        const { error } = await signUp(email, password, { 
          first_name: firstName, 
          last_name: lastName,
          selected_plan: selectedPlan
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast({ title: 'Erro', description: 'Este email já está cadastrado', variant: 'destructive' });
          } else {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Verifique seu email para confirmar o cadastro.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Exibe loader enquanto verifica estado de autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo e título */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full p-3 bg-white/20 border border-primary/10">
                <img 
                  src={mascotBust} 
                  alt="Gefin Mascote" 
                  className="h-56 w-56 object-contain drop-shadow-md"
                />
              </div>
            </div>
          </Link>
          <p className="text-muted-foreground mt-2">Seu gestor financeiro conversacional</p>
        </div>

        {/* Card do formulário */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>{isLogin ? 'Entrar' : 'Criar conta'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Acesse sua conta para continuar' 
                : 'Crie sua conta gratuitamente'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seletor de plano - exibido apenas no cadastro */}
              {!isLogin && currentPlan && (
                <div className="space-y-2">
                  <Label>Plano selecionado</Label>
                  <div 
                    className={cn(
                      "border rounded-lg p-3 cursor-pointer transition-all",
                      currentPlan.highlight 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setShowPlanSelector(!showPlanSelector)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          currentPlan.highlight ? "bg-primary" : "bg-success"
                        )} />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {currentPlan.name}
                            {currentPlan.highlight && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(currentPlan.price_monthly)}/mês
                          </div>
                        </div>
                      </div>
                      {showPlanSelector ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Dropdown de seleção de plano expandido */}
                  {showPlanSelector && plans && (
                    <div className="border rounded-lg overflow-hidden divide-y">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={cn(
                            "p-3 cursor-pointer transition-all hover:bg-muted/50",
                            selectedPlan === plan.slug && "bg-primary/5"
                          )}
                          onClick={() => {
                            setSelectedPlan(plan.slug);
                            setShowPlanSelector(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                selectedPlan === plan.slug 
                                  ? "border-primary bg-primary" 
                                  : "border-muted-foreground"
                              )}>
                                {selectedPlan === plan.slug && (
                                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {plan.name}
                                  {plan.highlight && (
                                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatPrice(plan.price_monthly)}/mês
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Preview de features do plano */}
                          {plan.features.length > 0 && (
                            <div className="mt-2 ml-7 flex flex-wrap gap-1">
                              {plan.features.slice(0, 3).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs font-normal">
                                  {feature}
                                </Badge>
                              ))}
                              {plan.features.length > 3 && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  +{plan.features.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Campos de nome - exibidos apenas no cadastro */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      placeholder="João"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      placeholder="Silva"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
              
              {/* Campo de email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {/* Campo de senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {/* Botão de submit */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>
            
            {/* Link para alternar entre login e cadastro */}
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
              </span>
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Criar conta' : 'Entrar'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
