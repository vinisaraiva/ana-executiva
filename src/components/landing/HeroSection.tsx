/**
 * @fileoverview Seção Hero da Landing Page - DrGeFin
 * 
 * Primeira seção visível da landing page, responsável por causar
 * impacto visual e apresentar a proposta de valor principal.
 * 
 * Elementos:
 * - Badge animado "Powered by IA"
 * - Título principal com gradiente
 * - Subtítulo explicativo
 * - Botões de CTA (Call to Action)
 * - Estatísticas de prova social
 * - Mascote GeFin com efeitos de glow
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import gefeinMascot from '@/assets/gefin-mascot.png';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props do componente HeroSection.
 * Permite customização do conteúdo via painel admin.
 */
interface HeroSectionProps {
  /** Título principal (headline) */
  headline?: string;
  /** Subtítulo explicativo */
  subtitle?: string;
  /** Texto do botão principal de CTA */
  ctaText?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Seção hero da landing page com animações de entrada.
 * 
 * Usa animações CSS com delay escalonado para criar efeito
 * de entrada sequencial dos elementos.
 * 
 * @param headline - Título principal (padrão: "Analise suas vendas com IA em minutos")
 * @param subtitle - Subtítulo explicativo
 * @param ctaText - Texto do botão principal
 * 
 * @example
 * // Com props customizadas
 * <HeroSection 
 *   headline="Seu novo título"
 *   subtitle="Descrição customizada"
 *   ctaText="Comece Agora"
 * />
 * 
 * // Com valores padrão
 * <HeroSection />
 */
export function HeroSection({ 
  headline = "Analise suas vendas com IA em minutos",
  subtitle = "Importe seus dados, converse com a IA e descubra insights que aumentam sua margem de lucro.",
  ctaText = "Começar Gratuitamente"
}: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      
      {/* ================================================================== */}
      {/* FUNDO ANIMADO */}
      {/* ================================================================== */}
      {/* Gradiente que se move suavemente */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 animate-gradient-x" style={{ backgroundSize: '200% 200%' }} />
      
      {/* Partículas flutuantes decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* ============================================================== */}
          {/* COLUNA ESQUERDA - CONTEÚDO TEXTUAL */}
          {/* ============================================================== */}
          <div className="space-y-8">
            
            {/* Badge "Powered by IA" com animação de entrada */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-success/20 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm opacity-0 animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <Sparkles className="h-4 w-4 animate-bounce-gentle" />
              Powered by IA
            </div>
            
            {/* Título principal (headline) */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight opacity-0 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                {headline}
              </span>
            </h1>
            
            {/* Subtítulo explicativo */}
            <p 
              className="text-xl text-muted-foreground max-w-lg opacity-0 animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              {subtitle}
            </p>
            
            {/* Botões de CTA */}
            <div 
              className="flex flex-col sm:flex-row gap-4 opacity-0 animate-slide-up"
              style={{ animationDelay: '0.4s' }}
            >
              {/* Botão principal com gradiente */}
              <Button 
                size="lg" 
                className="text-lg px-8 bg-gradient-to-r from-primary to-success hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-105 duration-300" 
                asChild
              >
                <Link to="/login?plan=starter">
                  {ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              {/* Botão secundário (outline) */}
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300" 
                asChild
              >
                <a href="#how-it-works">Ver como funciona</a>
              </Button>
            </div>
            
            {/* Estatísticas de prova social */}
            <div 
              className="flex items-center gap-6 pt-4 opacity-0 animate-slide-up"
              style={{ animationDelay: '0.5s' }}
            >
              {/* Empresas */}
              <div className="text-center group">
                <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">500+</div>
                <div className="text-sm text-muted-foreground">Empresas</div>
              </div>
              
              {/* Divisor vertical com gradiente */}
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              
              {/* Vendas analisadas */}
              <div className="text-center group">
                <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">1M+</div>
                <div className="text-sm text-muted-foreground">Vendas Analisadas</div>
              </div>
              
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              
              {/* Satisfação */}
              <div className="text-center group">
                <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">99%</div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
            </div>
          </div>
          
          {/* ============================================================== */}
          {/* COLUNA DIREITA - MASCOTE */}
          {/* ============================================================== */}
          <div 
            className="relative flex justify-center lg:justify-end opacity-0 animate-scale-in"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="relative">
              {/* Anel de glow externo */}
              <div className="absolute inset-0 bg-gradient-to-br from-success/15 via-primary/10 to-transparent rounded-full blur-3xl transform scale-125 animate-pulse-glow" />
              
              {/* Glow interno */}
              <div className="absolute inset-0 bg-gradient-to-t from-success/10 to-transparent rounded-full blur-2xl" />
              
              {/* Imagem do mascote com animação de flutuação */}
              <img 
                src={gefeinMascot}
                alt="Dr. GeFin - Seu assistente financeiro com IA"
                className="relative z-10 w-full max-w-md lg:max-w-lg drop-shadow-2xl animate-float"
              />
              
              {/* Elementos decorativos flutuantes ao redor do mascote */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-success/15 rounded-full blur-sm animate-bounce-gentle" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary/15 rounded-full blur-sm animate-bounce-gentle" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 -right-8 w-4 h-4 bg-accent/15 rounded-full blur-sm animate-bounce-gentle" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
