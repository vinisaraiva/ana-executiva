/**
 * @fileoverview Seção de Preços (Pricing) da Landing Page - DrGeFin
 * 
 * Exibe os planos disponíveis do produto com preços, recursos e CTAs.
 * Os planos são carregados dinamicamente do banco de dados (landing_plans).
 * 
 * Funcionalidades:
 * - Toggle mensal/anual com desconto
 * - Cards de planos com destaque opcional
 * - Lista de recursos incluídos
 * - CTAs personalizados por plano
 * - Loading state enquanto carrega do banco
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface de um plano da landing page.
 * Baseada na tabela landing_plans do Supabase.
 */
interface LandingPlan {
  /** UUID do plano */
  id: string;
  /** Nome exibido do plano */
  name: string;
  /** Slug para URL (ex: ?plan=professional) */
  slug: string;
  /** Descrição curta do plano */
  description: string | null;
  /** Preço mensal em centavos (null = grátis) */
  price_monthly: number | null;
  /** Preço anual em centavos (null = grátis) */
  price_yearly: number | null;
  /** Lista de recursos incluídos */
  features: string[];
  /** Se este plano deve ser destacado */
  highlight: boolean;
  /** Texto do badge de destaque (ex: "Mais Popular") */
  highlight_text: string | null;
  /** Se o plano está ativo e visível */
  is_active: boolean;
  /** Ordem de exibição */
  display_order: number;
  /** Texto do botão CTA */
  cta_text: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Seção de preços com planos dinâmicos do banco de dados.
 * 
 * Layout responsivo:
 * - 1 plano: centralizado, largura máxima
 * - 2 planos: 2 colunas
 * - 3 planos: 3 colunas
 * - 4+ planos: 2x2 ou 4 colunas
 * 
 * @example
 * <PricingSection />
 */
export function PricingSection() {
  // Estado para toggle mensal/anual
  const [isYearly, setIsYearly] = useState(false);

  // ============================================================================
  // BUSCA DE PLANOS
  // ============================================================================
  
  /**
   * Carrega planos ativos do banco, ordenados por display_order.
   */
  const { data: plans, isLoading } = useQuery({
    queryKey: ['landing-plans'],
    queryFn: async (): Promise<LandingPlan[]> => {
      const { data, error } = await supabase
        .from('landing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Converte features de JSON para array de strings
      return (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
    }
  });

  // ============================================================================
  // FORMATAÇÃO
  // ============================================================================
  
  /**
   * Formata preço como moeda brasileira ou "Grátis".
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

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================

  return (
    <section id="pricing" className="relative py-20 px-4 overflow-hidden">
      
      {/* ================================================================== */}
      {/* FUNDO E DECORAÇÕES */}
      {/* ================================================================== */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Blurs decorativos */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-success/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto relative z-10">
        
        {/* ================================================================ */}
        {/* CABEÇALHO */}
        {/* ================================================================ */}
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-4 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Planos para todos os tamanhos
          </h2>
          <p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Escolha o plano ideal para o seu negócio. Comece grátis e faça upgrade quando precisar.
          </p>
          
          {/* ============================================================== */}
          {/* TOGGLE MENSAL/ANUAL */}
          {/* ============================================================== */}
          <div 
            className="flex items-center justify-center gap-3 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <span className={cn("text-sm transition-colors", !isYearly ? "text-foreground font-medium" : "text-muted-foreground")}>
              Mensal
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-success"
            />
            <span className={cn("text-sm transition-colors", isYearly ? "text-foreground font-medium" : "text-muted-foreground")}>
              Anual
              <Badge variant="secondary" className="ml-2 text-xs bg-success/10 text-success border-success/20">
                -17%
              </Badge>
            </span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* LOADING STATE */}
        {/* ================================================================ */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          
          /* ================================================================ */
          /* GRID DE PLANOS */
          /* ================================================================ */
          <div className={cn(
            "grid gap-6 max-w-5xl mx-auto",
            // Ajusta colunas baseado na quantidade de planos
            plans?.length === 1 && "md:grid-cols-1 max-w-md",
            plans?.length === 2 && "md:grid-cols-2 max-w-2xl",
            plans?.length === 3 && "md:grid-cols-3",
            (plans?.length || 0) >= 4 && "md:grid-cols-2 lg:grid-cols-4"
          )}>
            {plans?.map((plan, index) => {
              // Seleciona preço baseado no toggle
              const price = isYearly ? plan.price_yearly : plan.price_monthly;
              
              // Calcula equivalente mensal para plano anual
              const monthlyEquivalent = isYearly && plan.price_yearly 
                ? Math.round(plan.price_yearly / 12) 
                : null;
              
              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "group relative flex flex-col border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl opacity-0 animate-slide-up overflow-hidden",
                    // Estilo especial para plano destacado
                    plan.highlight 
                      ? "border-primary shadow-lg shadow-primary/10 bg-gradient-to-b from-card to-primary/5 scale-105 z-10" 
                      : "border-border hover:border-primary/30 bg-card/80 backdrop-blur-sm"
                  )}
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  {/* Efeito de glow para plano destacado */}
                  {plan.highlight && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-success/5 animate-pulse-glow opacity-50" />
                  )}
                  
                  {/* Badge de destaque (ex: "Mais Popular") */}
                  {plan.highlight && plan.highlight_text && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-primary to-success text-primary-foreground px-4 py-1 shadow-lg flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {plan.highlight_text}
                      </Badge>
                    </div>
                  )}
                  
                  {/* ====================================================== */}
                  {/* CABEÇALHO DO CARD */}
                  {/* ====================================================== */}
                  <CardHeader className="text-center pb-4 relative">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  
                  {/* ====================================================== */}
                  {/* CONTEÚDO DO CARD */}
                  {/* ====================================================== */}
                  <CardContent className="flex-1 flex flex-col relative">
                    
                    {/* Preço */}
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {formatPrice(price)}
                      </div>
                      {price !== null && price > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {isYearly ? '/ano' : '/mês'}
                          {monthlyEquivalent && (
                            <span className="block text-xs">
                              (~{formatPrice(monthlyEquivalent)}/mês)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Lista de recursos */}
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2 group/item">
                          {/* Check icon com fundo verde */}
                          <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-success/20 transition-colors">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Botão CTA */}
                    <Button 
                      className={cn(
                        "w-full transition-all duration-300",
                        plan.highlight 
                          ? "bg-gradient-to-r from-primary to-success hover:opacity-90 shadow-lg hover:shadow-primary/25" 
                          : "hover:bg-primary hover:text-primary-foreground"
                      )}
                      variant={plan.highlight ? "default" : "outline"}
                      asChild
                    >
                      <Link to={`/login?plan=${plan.slug}`}>{plan.cta_text}</Link>
                    </Button>
                  </CardContent>
                  
                  {/* Linha de acento no hover */}
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
