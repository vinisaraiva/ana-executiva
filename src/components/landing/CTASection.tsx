/**
 * @fileoverview Seção CTA Final da Landing Page - DrGeFin
 * 
 * Última seção antes do rodapé, com forte apelo para conversão.
 * Inclui o mascote, título persuasivo e botões de ação.
 * 
 * Esta seção usa fundo com gradiente animado e partículas
 * flutuantes para criar impacto visual.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import gefeinMascotBust from '@/assets/gefin-mascot-bust.png';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Seção de Call to Action final da landing page.
 * 
 * Objetivo: converter visitantes em usuários através de:
 * - Título persuasivo
 * - Prova social
 * - CTA primário destacado
 * - CTA secundário para ver planos
 * 
 * @example
 * <CTASection />
 */
export function CTASection() {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      
      {/* ================================================================== */}
      {/* FUNDO ANIMADO */}
      {/* ================================================================== */}
      {/* Gradiente que se move suavemente */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-success/5 to-primary/10 animate-gradient-x" style={{ backgroundSize: '200% 200%' }} />
      
      {/* Linhas decorativas horizontais */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Partículas flutuantes decorativas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[10%] w-3 h-3 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-20 right-[15%] w-2 h-2 bg-success/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-10 left-[20%] w-4 h-4 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-[25%] w-2 h-2 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center">
          
          {/* ============================================================== */}
          {/* MASCOTE */}
          {/* ============================================================== */}
          <div 
            className="inline-block mb-6 opacity-0 animate-scale-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="relative">
              {/* Efeito de glow pulsante */}
              <div className="absolute inset-0 bg-success/30 rounded-full blur-xl animate-pulse-glow" />
              <img 
                src={gefeinMascotBust}
                alt="Dr. GeFin"
                className="relative z-10 h-28 w-28 mx-auto object-contain animate-float"
              />
            </div>
          </div>
          
          {/* ============================================================== */}
          {/* TÍTULO PERSUASIVO */}
          {/* ============================================================== */}
          <h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-4 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Pronto para transformar seus dados em decisões?
          </h2>
          
          {/* ============================================================== */}
          {/* PROVA SOCIAL */}
          {/* ============================================================== */}
          <p 
            className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto opacity-0 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            Junte-se a centenas de empresas que já estão usando o DrGeFin para 
            descobrir insights valiosos e aumentar suas margens de lucro.
          </p>
          
          {/* ============================================================== */}
          {/* BOTÕES DE CTA */}
          {/* ============================================================== */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            {/* CTA Primário - Começar */}
            <Button 
              size="lg" 
              className="text-lg px-8 bg-gradient-to-r from-primary to-success hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-105 duration-300 group" 
              asChild
            >
              <Link to="/login">
                <Sparkles className="mr-2 h-5 w-5 group-hover:animate-bounce-gentle" />
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            {/* CTA Secundário - Ver planos */}
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300" 
              asChild
            >
              <a href="#pricing">Ver planos</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
