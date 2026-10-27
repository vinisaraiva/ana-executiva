/**
 * @fileoverview Seção de Recursos (Features) da Landing Page - DrGeFin
 * 
 * Apresenta os principais recursos e funcionalidades do produto
 * em formato de cards com ícones e descrições.
 * 
 * Características:
 * - Grid responsivo (1, 2 ou 4 colunas)
 * - Animações de hover nos cards
 * - Ícones dinâmicos baseados em string
 * - Suporte a dados customizados via props
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { MessageSquare, BarChart3, Upload, Shield, LucideIcon, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface para um recurso/funcionalidade.
 */
interface Feature {
  /** Nome do ícone (deve corresponder a uma chave em iconMap) */
  icon: string;
  /** Título do recurso */
  title: string;
  /** Descrição detalhada do recurso */
  description: string;
}

/**
 * Props do componente FeaturesSection.
 */
interface FeaturesSectionProps {
  /** Lista de recursos a exibir (usa padrão se não fornecido) */
  features?: Feature[];
}

// ============================================================================
// MAPEAMENTO DE ÍCONES
// ============================================================================

/**
 * Mapa de ícones disponíveis para os recursos.
 * Permite usar ícones como strings (útil para dados do banco).
 */
const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  BarChart3,
  Upload,
  Shield,
  Zap,
  TrendingUp,
};

// ============================================================================
// DADOS PADRÃO
// ============================================================================

/**
 * Recursos padrão exibidos quando nenhum é fornecido via props.
 */
const defaultFeatures: Feature[] = [
  {
    icon: 'MessageSquare',
    title: 'Chat com IA',
    description: 'Pergunte sobre vendas, margens, produtos e receba respostas instantâneas baseadas nos seus dados.'
  },
  {
    icon: 'BarChart3',
    title: 'Dashboard Inteligente',
    description: 'Visualize KPIs, gráficos e rankings automaticamente calculados a partir das suas importações.'
  },
  {
    icon: 'Upload',
    title: 'Import Fácil',
    description: 'Faça upload de arquivos Excel com mapeamento automático de colunas. Sem configuração manual.'
  },
  {
    icon: 'Shield',
    title: 'Multi-tenant Seguro',
    description: 'Dados isolados por empresa com RLS. Cada cliente só vê suas próprias informações.'
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Seção de recursos da landing page.
 * 
 * Exibe cards com ícones, títulos e descrições em um grid responsivo.
 * Cada card tem animações de hover e efeitos visuais.
 * 
 * @param features - Lista de recursos (usa padrão se não fornecido)
 * 
 * @example
 * // Com recursos customizados
 * <FeaturesSection features={[
 *   { icon: 'Zap', title: 'Velocidade', description: 'Análises em segundos' }
 * ]} />
 * 
 * // Com recursos padrão
 * <FeaturesSection />
 */
export function FeaturesSection({ features = defaultFeatures }: FeaturesSectionProps) {
  return (
    <section id="features" className="relative py-20 px-4 overflow-hidden">
      
      {/* ================================================================== */}
      {/* FUNDO E DECORAÇÕES */}
      {/* ================================================================== */}
      {/* Gradiente de fundo sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />
      
      {/* Linhas decorativas no topo e fundo */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto relative z-10">
        
        {/* ================================================================ */}
        {/* CABEÇALHO DA SEÇÃO */}
        {/* ================================================================ */}
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-4 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Tudo que você precisa para analisar suas vendas
          </h2>
          <p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Ferramentas poderosas e fáceis de usar para transformar seus dados em decisões estratégicas.
          </p>
        </div>
        
        {/* ================================================================ */}
        {/* GRID DE CARDS */}
        {/* ================================================================ */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            // Busca o ícone pelo nome, usa MessageSquare como fallback
            const Icon = iconMap[feature.icon] || MessageSquare;
            
            return (
              <Card 
                key={index} 
                className="group relative bg-card/80 backdrop-blur-sm border-border hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2 opacity-0 animate-slide-up overflow-hidden"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                {/* Efeito de glow no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative">
                  {/* Container do ícone com gradiente */}
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                    <Icon className="h-7 w-7 text-primary group-hover:text-success transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative">
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
                {/* Linha de acento no fundo que aparece no hover */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
