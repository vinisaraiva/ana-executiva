/**
 * @fileoverview Calculadora de Economia - DrGeFin
 * 
 * Calculadora interativa que demonstra o ROI do DrGeFin comparando
 * o custo de consultorias tradicionais com o custo da plataforma.
 * 
 * Funcionalidades:
 * - Sliders para ajustar horas de cada serviço
 * - Cálculo em tempo real de economia mensal/anual
 * - Busca configurações do admin (valores dinâmicos)
 * - ROI calculado automaticamente
 * - CTA para conversão
 * 
 * Os valores podem ser configurados pelo admin no painel administrativo.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  PiggyBank, 
  Calculator, 
  BarChart3,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Configuração de um serviço de consultoria para a calculadora.
 */
interface ServiceConfig {
  /** Identificador único do serviço */
  id: string;
  /** Nome exibido do serviço */
  name: string;
  /** Valor por hora do consultor (R$) */
  hourlyRate: number;
  /** Máximo de horas no slider */
  maxHours: number;
  /** Valor inicial do slider */
  defaultHours: number;
  /** Descrição curta do serviço */
  description: string;
}

/**
 * Configurações completas da calculadora (vindas do admin).
 */
interface CalculatorSettings {
  /** Custo mensal da plataforma DrGeFin */
  platformMonthlyCost: number;
  /** Lista de serviços de consultoria */
  services: ServiceConfig[];
}

// ============================================================================
// DADOS PADRÃO
// ============================================================================

/**
 * Serviços padrão exibidos quando não há configuração no banco.
 */
const defaultServices: ServiceConfig[] = [
  {
    id: 'financial',
    name: 'Análise Financeira',
    hourlyRate: 300,
    maxHours: 20,
    defaultHours: 4,
    description: 'Fluxo de caixa, DRE, balanços'
  },
  {
    id: 'pricing',
    name: 'Consultoria de Preços',
    hourlyRate: 250,
    maxHours: 15,
    defaultHours: 2,
    description: 'Precificação e margens'
  },
  {
    id: 'reports',
    name: 'Relatórios Gerenciais',
    hourlyRate: 200,
    maxHours: 15,
    defaultHours: 3,
    description: 'Dashboards e KPIs'
  },
  {
    id: 'dataAnalysis',
    name: 'Análise de Dados',
    hourlyRate: 220,
    maxHours: 10,
    defaultHours: 2,
    description: 'Insights e tendências'
  }
];

/**
 * Custo mensal padrão da plataforma.
 */
const DEFAULT_PLATFORM_COST = 297;

/**
 * Mapa de ícones para cada tipo de serviço.
 */
const serviceIcons: Record<string, React.ElementType> = {
  financial: BarChart3,
  pricing: DollarSign,
  reports: Calculator,
  dataAnalysis: TrendingUp
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Calculadora interativa de economia da landing page.
 * 
 * Permite que o visitante ajuste horas estimadas de cada serviço
 * de consultoria e veja em tempo real quanto economizaria usando
 * o DrGeFin ao invés de consultorias tradicionais.
 * 
 * @example
 * <SavingsCalculator />
 */
export function SavingsCalculator() {
  // ============================================================================
  // BUSCA DE CONFIGURAÇÕES DO ADMIN
  // ============================================================================
  
  /**
   * Busca configurações customizadas da calculadora no banco.
   * Se não existirem, usa os valores padrão.
   */
  const { data: settings } = useQuery({
    queryKey: ['calculator-settings'],
    queryFn: async (): Promise<CalculatorSettings | null> => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'calculator_settings')
        .maybeSingle();

      if (error) throw error;
      if (!data?.value) return null;
      return data.value as unknown as CalculatorSettings;
    }
  });

  // Usa configurações do admin ou valores padrão
  const services = settings?.services ?? defaultServices;
  const platformCost = settings?.platformMonthlyCost ?? DEFAULT_PLATFORM_COST;

  // ============================================================================
  // ESTADO DOS SLIDERS
  // ============================================================================
  
  /**
   * Estado que armazena as horas selecionadas para cada serviço.
   * Chave: ID do serviço, Valor: horas selecionadas.
   */
  const [hours, setHours] = useState<Record<string, number>>(() => 
    defaultServices.reduce((acc, service) => ({
      ...acc,
      [service.id]: service.defaultHours
    }), {})
  );

  // Atualiza horas quando as configurações carregam do banco
  useMemo(() => {
    if (settings?.services) {
      const newHours: Record<string, number> = {};
      settings.services.forEach(service => {
        newHours[service.id] = hours[service.id] ?? service.defaultHours;
      });
      if (Object.keys(newHours).length !== Object.keys(hours).length) {
        setHours(prev => ({ ...prev, ...newHours }));
      }
    }
  }, [settings?.services]);

  // ============================================================================
  // CÁLCULOS
  // ============================================================================
  
  /**
   * Calcula todos os valores derivados: custo do consultor, economia, ROI.
   * Usa useMemo para evitar recálculos desnecessários.
   */
  const calculations = useMemo(() => {
    // Soma o custo total de todas as consultorias
    const consultantCost = services.reduce((total, service) => {
      return total + ((hours[service.id] ?? service.defaultHours) * service.hourlyRate);
    }, 0);

    // Economia = custo consultoria - custo plataforma
    const monthlySavings = Math.max(0, consultantCost - platformCost);
    const annualSavings = monthlySavings * 12;
    
    // ROI = ((custo consultoria - custo plataforma) / custo plataforma) * 100
    const roi = consultantCost > 0 
      ? Math.round(((consultantCost - platformCost) / platformCost) * 100)
      : 0;

    return {
      consultantCost,
      platformCost,
      monthlySavings,
      annualSavings,
      roi
    };
  }, [hours, services, platformCost]);

  // ============================================================================
  // FORMATAÇÃO
  // ============================================================================
  
  /**
   * Formata um valor numérico como moeda brasileira (R$).
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================

  return (
    <section id="calculadora" className="py-20 md:py-28 relative overflow-hidden">
      
      {/* ================================================================== */}
      {/* DECORAÇÕES DE FUNDO */}
      {/* ================================================================== */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        
        {/* ================================================================ */}
        {/* CABEÇALHO */}
        {/* ================================================================ */}
        <div className="text-center mb-12 md:mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
            <PiggyBank className="w-4 h-4 mr-2 text-primary" />
            Calculadora de Economia
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Quanto você <span className="text-primary">economiza</span> com o DrGeFin?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ajuste os sliders para ver quanto você economiza substituindo consultorias tradicionais pela nossa plataforma
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          
          {/* ================================================================ */}
          {/* LADO ESQUERDO - SLIDERS */}
          {/* ================================================================ */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6 space-y-8">
                
                {/* Instrução */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calculator className="w-4 h-4" />
                  <span>Ajuste as horas mensais de cada serviço</span>
                </div>

                {/* Sliders para cada serviço */}
                {services.map((service) => {
                  const Icon = serviceIcons[service.id] || Calculator;
                  const currentHours = hours[service.id] ?? service.defaultHours;
                  const currentCost = currentHours * service.hourlyRate;

                  return (
                    <div key={service.id} className="space-y-3">
                      
                      {/* Cabeçalho do serviço */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{service.name}</h4>
                            <p className="text-xs text-muted-foreground">{service.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-foreground">{currentHours}h</span>
                          <span className="text-xs text-muted-foreground">/mês</span>
                        </div>
                      </div>
                      
                      {/* Slider */}
                      <Slider
                        value={[currentHours]}
                        onValueChange={(value) => setHours(prev => ({ ...prev, [service.id]: value[0] }))}
                        max={service.maxHours}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      
                      {/* Informações de custo */}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(service.hourlyRate)}/hora</span>
                        <span className="text-destructive/80">
                          Custo atual: {formatCurrency(currentCost)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* ================================================================ */}
          {/* LADO DIREITO - RESULTADOS */}
          {/* ================================================================ */}
          <div className="flex flex-col gap-6">
            
            {/* Card de comparação de custos */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6 space-y-6">
                <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Comparativo de Custos
                </h3>

                {/* Custo com consultores (vermelho) */}
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Custo com consultores</span>
                    <span className="text-2xl font-bold text-destructive">
                      {formatCurrency(calculations.consultantCost)}
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </span>
                  </div>
                </div>

                {/* Custo DrGeFin (verde/primary) */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Custo DrGeFin</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculations.platformCost)}
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de destaque da economia */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-xl relative overflow-hidden">
              {/* Decoração de blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
              
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Sua economia</span>
                </div>

                <div className="space-y-4">
                  {/* Economia mensal */}
                  <div className="text-center p-4 rounded-lg bg-background/60 backdrop-blur-sm">
                    <p className="text-sm text-muted-foreground mb-1">Economia mensal</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary">
                      {formatCurrency(calculations.monthlySavings)}
                    </p>
                  </div>

                  {/* Economia anual (destaque maior) */}
                  <div className="text-center p-4 rounded-xl bg-primary/20 border border-primary/30">
                    <p className="text-sm text-primary/80 mb-1">Economia anual</p>
                    <p className="text-4xl md:text-5xl font-bold text-primary">
                      {formatCurrency(calculations.annualSavings)}
                    </p>
                    {calculations.roi > 0 && (
                      <Badge className="mt-3 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                        ROI: {calculations.roi}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* CTA de conversão */}
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full mt-6 text-lg h-14 shadow-lg hover:shadow-xl transition-all"
                >
                  <Link to="/login?plan=professional">
                    Comece a economizar agora
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Teste grátis por 14 dias • Sem compromisso
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
