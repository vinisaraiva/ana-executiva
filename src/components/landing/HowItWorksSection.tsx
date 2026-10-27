/**
 * @fileoverview Seção "Como Funciona" da Landing Page - DrGeFin
 * 
 * Apresenta os 3 passos simples para usar o produto:
 * 1. Faça upload do arquivo
 * 2. Análise automática
 * 3. Converse com a IA
 * 
 * Inclui conectores animados entre os passos e o mascote GeFin.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Upload, BarChart2, MessageCircle } from 'lucide-react';
import gefeinMascotBust from '@/assets/gefin-mascot-bust.png';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface para um passo do processo.
 */
interface Step {
  /** Número do passo (1, 2, 3, etc.) */
  step: number;
  /** Título curto do passo */
  title: string;
  /** Descrição do que acontece neste passo */
  description: string;
}

/**
 * Props do componente HowItWorksSection.
 */
interface HowItWorksSectionProps {
  /** Lista de passos a exibir (usa padrão se não fornecido) */
  steps?: Step[];
}

// ============================================================================
// DADOS PADRÃO
// ============================================================================

/**
 * Passos padrão do processo de uso do DrGeFin.
 */
const defaultSteps: Step[] = [
  { step: 1, title: 'Faça upload', description: 'Envie seu arquivo Excel ou CSV com dados de vendas.' },
  { step: 2, title: 'Análise automática', description: 'O sistema calcula métricas, rankings e detecta anomalias.' },
  { step: 3, title: 'Converse com IA', description: 'Pergunte qualquer coisa sobre seus dados e receba insights.' }
];

/**
 * Ícones correspondentes a cada passo (na mesma ordem de defaultSteps).
 */
const stepIcons = [Upload, BarChart2, MessageCircle];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Seção que explica o fluxo de uso do produto em passos visuais.
 * 
 * Layout:
 * - 3 colunas para os passos (em desktop)
 * - 1 coluna para o mascote (em desktop)
 * - Conectores animados entre os passos
 * - Badges numerados com animação
 * 
 * @param steps - Lista de passos (usa padrão se não fornecido)
 * 
 * @example
 * // Com passos customizados
 * <HowItWorksSection steps={[
 *   { step: 1, title: 'Passo 1', description: 'Faça isso' }
 * ]} />
 * 
 * // Com passos padrão
 * <HowItWorksSection />
 */
export function HowItWorksSection({ steps = defaultSteps }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="relative py-20 px-4 overflow-hidden">
      
      {/* ================================================================== */}
      {/* DECORAÇÕES DE FUNDO */}
      {/* ================================================================== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto relative z-10">
        
        {/* ================================================================ */}
        {/* CABEÇALHO DA SEÇÃO */}
        {/* ================================================================ */}
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-4 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Como funciona
          </h2>
          <p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Em apenas 3 passos simples, transforme seus dados em insights valiosos.
          </p>
        </div>
        
        {/* ================================================================ */}
        {/* GRID: PASSOS + MASCOTE */}
        {/* ================================================================ */}
        <div className="grid lg:grid-cols-4 gap-8 max-w-6xl mx-auto items-center">
          
          {/* ============================================================== */}
          {/* PASSOS (3 colunas) */}
          {/* ============================================================== */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => {
                // Seleciona o ícone correspondente ao índice
                const Icon = stepIcons[index] || Upload;
                
                return (
                  <div 
                    key={index} 
                    className="relative text-center group opacity-0 animate-slide-up"
                    style={{ animationDelay: `${0.2 + index * 0.15}s` }}
                  >
                    {/* ================================================== */}
                    {/* LINHA CONECTORA (entre passos) */}
                    {/* ================================================== */}
                    {/* Visível apenas em desktop e não no último passo */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary via-success to-primary/30 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                      </div>
                    )}
                    
                    {/* ================================================== */}
                    {/* CÍRCULO DO PASSO */}
                    {/* ================================================== */}
                    <div className="relative inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-success/10 mb-6 group-hover:from-primary/20 group-hover:to-success/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/20">
                      <Icon className="h-10 w-10 text-primary group-hover:text-success transition-colors duration-300" />
                      
                      {/* Badge com número do passo */}
                      <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-success text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg animate-bounce-gentle" style={{ animationDelay: `${index * 0.2}s` }}>
                        {step.step}
                      </div>
                    </div>
                    
                    {/* Título do passo */}
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    
                    {/* Descrição do passo */}
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* ============================================================== */}
          {/* MASCOTE (1 coluna) */}
          {/* ============================================================== */}
          {/* Visível apenas em desktop (lg:flex) */}
          <div className="hidden lg:flex justify-center opacity-0 animate-scale-in" style={{ animationDelay: '0.5s' }}>
            <div className="relative">
              {/* Efeito de glow pulsante */}
              <div className="absolute inset-0 bg-gradient-to-t from-success/20 to-transparent rounded-full blur-2xl animate-pulse-glow" />
              <img 
                src={gefeinMascotBust}
                alt="Dr. GeFin"
                className="relative z-10 w-40 h-40 object-contain animate-float"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
