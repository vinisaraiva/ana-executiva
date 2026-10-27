/**
 * @fileoverview Landing Page - DrGeFin
 * 
 * Página de marketing/vendas do produto, composta por seções modulares:
 * 
 * - Header: Navegação e logo
 * - Hero: Título principal e CTA
 * - Features: Recursos do produto
 * - How It Works: Passo a passo de uso
 * - Savings Calculator: Calculadora de economia
 * - Pricing: Planos e preços
 * - CTA: Chamada final para ação
 * - FAQ: Perguntas frequentes
 * - Footer: Links e informações
 * 
 * Os textos são dinâmicos e podem ser configurados via painel admin
 * através da tabela platform_settings.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Estrutura das configurações da landing page.
 * Configuráveis via painel admin.
 */
interface LandingSettings {
  /** Título principal do hero */
  hero_headline?: string;
  /** Subtítulo do hero */
  hero_subtitle?: string;
  /** Texto do botão CTA do hero */
  hero_cta_text?: string;
  /** Lista de features com ícone, título e descrição */
  features?: Array<{ icon: string; title: string; description: string }>;
  /** Passos do "como funciona" */
  how_it_works?: Array<{ step: number; title: string; description: string }>;
  /** Perguntas frequentes */
  faq?: Array<{ question: string; answer: string }>;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Landing page do DrGeFin.
 * 
 * Página pública de marketing que apresenta o produto,
 * seus recursos, planos e call-to-actions para conversão.
 * 
 * Os textos são carregados dinamicamente do banco de dados
 * para permitir edição via painel administrativo.
 */
export default function LandingPage() {
  // Busca configurações customizáveis da landing page
  const { data: settings } = useQuery({
    queryKey: ['landing-settings'],
    queryFn: async (): Promise<LandingSettings | null> => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'landing_page_settings')
        .maybeSingle();

      if (error) throw error;
      return data?.value as LandingSettings || null;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo com navegação */}
      <LandingHeader />
      
      <main>
        {/* Seção Hero - Título principal e CTA */}
        <HeroSection 
          headline={settings?.hero_headline}
          subtitle={settings?.hero_subtitle}
          ctaText={settings?.hero_cta_text}
        />
        
        {/* Seção de Features/Recursos */}
        <FeaturesSection features={settings?.features} />
        
        {/* Seção Como Funciona */}
        <HowItWorksSection steps={settings?.how_it_works} />
        
        {/* Calculadora de Economia */}
        <SavingsCalculator />
        
        {/* Seção de Planos e Preços */}
        <PricingSection />
        
        {/* Call to Action final */}
        <CTASection />
        
        {/* Perguntas Frequentes */}
        <FAQSection faqs={settings?.faq} />
      </main>
      
      {/* Footer com links e informações legais */}
      <LandingFooter />
    </div>
  );
}
