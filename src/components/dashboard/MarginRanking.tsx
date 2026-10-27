/**
 * @fileoverview Rankings por Margem de Lucro - DrGeFin
 * 
 * Componente que exibe rankings de margem em abas:
 * 
 * Aba Produtos:
 * - Produtos com melhores margens
 * - Produtos com piores margens (< 15%)
 * 
 * Aba Vendedores:
 * - Vendedores com maior contribuição de margem
 * - Vendedores com maior desconto médio (alerta)
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Package, User, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um produto com margem.
 */
interface MarginItem {
  /** Nome do produto */
  name: string;
  /** Valor total de vendas */
  value: number;
  /** Margem de lucro em percentual */
  margin: number;
}

/**
 * Estrutura de um vendedor com métricas de margem.
 */
interface SellerMarginItem {
  /** Nome do vendedor */
  name: string;
  /** Valor total de vendas */
  value: number;
  /** Desconto médio concedido (em valor absoluto) */
  avgDiscount: number;
  /** Contribuição total para a margem da empresa */
  marginContribution: number;
}

/**
 * Propriedades do componente MarginRanking.
 */
interface MarginRankingProps {
  /** Produtos ordenados por margem (desc) */
  productsByMargin: MarginItem[];
  /** Vendedores ordenados por contribuição de margem (desc) */
  sellersByMargin: SellerMarginItem[];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de ranking por margem de lucro.
 * 
 * Exibe rankings em abas para análise de margem por produto
 * e por vendedor, destacando tanto os melhores quanto os
 * que precisam de atenção.
 * 
 * @example
 * ```tsx
 * <MarginRanking
 *   productsByMargin={[
 *     { name: 'Produto A', value: 50000, margin: 35.5 },
 *     { name: 'Produto B', value: 30000, margin: 8.2 },
 *   ]}
 *   sellersByMargin={[
 *     { name: 'João', value: 80000, avgDiscount: 500, marginContribution: 12000 },
 *   ]}
 * />
 * ```
 */
export function MarginRanking({ productsByMargin, sellersByMargin }: MarginRankingProps) {
  /**
   * Formata valor como moeda brasileira.
   */
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /**
   * Formata valor como percentual.
   */
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Verifica se há dados para exibir
  const hasData = productsByMargin.length > 0 || sellersByMargin.length > 0;

  // Não renderiza se não houver dados
  if (!hasData) {
    return null;
  }

  // Top 5 produtos com melhores margens
  const topProductsByMargin = productsByMargin.slice(0, 5);
  
  // Top 5 produtos com piores margens (ordenado ascendente)
  const bottomProductsByMargin = [...productsByMargin]
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 5);

  // Top 5 vendedores por contribuição de margem
  const topSellersByMargin = sellersByMargin.slice(0, 5);
  
  // Top 5 vendedores por desconto médio (quem dá mais desconto)
  const sellersByDiscount = [...sellersByMargin]
    .filter(s => s.avgDiscount > 0)
    .sort((a, b) => b.avgDiscount - a.avgDiscount)
    .slice(0, 5);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="h-4 w-4 text-success" />
          Ranking por Margem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products" className="w-full">
          {/* Abas de navegação */}
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-3 w-3" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="sellers" className="gap-2">
              <User className="h-3 w-3" />
              Vendedores
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo: Aba Produtos */}
          <TabsContent value="products" className="space-y-4">
            {/* Seção: Melhores margens */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Melhores Margens</span>
              </div>
              <div className="space-y-2">
                {topProductsByMargin.map((product, index) => (
                  <div 
                    key={product.name} 
                    className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/10"
                  >
                    <div className="flex items-center gap-2">
                      {/* Badge de posição */}
                      <span className="h-5 w-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      {/* Nome do produto */}
                      <span className="text-sm font-medium truncate max-w-[120px]">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Valor de vendas */}
                      <span className="text-xs text-muted-foreground">{formatCurrency(product.value)}</span>
                      {/* Margem em destaque */}
                      <span className="text-sm font-bold text-success">{formatPercent(product.margin)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção: Piores margens (só exibe se houver margens < 15%) */}
            {bottomProductsByMargin.length > 0 && bottomProductsByMargin[0].margin < 15 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Piores Margens</span>
                </div>
                <div className="space-y-2">
                  {bottomProductsByMargin.filter(p => p.margin < 15).slice(0, 3).map((product, index) => (
                    <div 
                      key={product.name} 
                      className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[120px]">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{formatCurrency(product.value)}</span>
                        <span className="text-sm font-bold text-destructive">{formatPercent(product.margin)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Conteúdo: Aba Vendedores */}
          <TabsContent value="sellers" className="space-y-4">
            {/* Seção: Maior contribuição de margem */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Maior Contribuição de Margem</span>
              </div>
              <div className="space-y-2">
                {topSellersByMargin.map((seller, index) => (
                  <div 
                    key={seller.name} 
                    className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[120px]">{seller.name}</span>
                    </div>
                    {/* Contribuição de margem em destaque */}
                    <span className="text-sm font-bold text-success">{formatCurrency(seller.marginContribution)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção: Vendedores com maior desconto médio (alerta) */}
            {sellersByDiscount.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-warning">Maior Desconto Médio</span>
                </div>
                <div className="space-y-2">
                  {sellersByDiscount.slice(0, 3).map((seller, index) => (
                    <div 
                      key={seller.name} 
                      className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[120px]">{seller.name}</span>
                      </div>
                      {/* Desconto médio em destaque */}
                      <span className="text-sm font-bold text-warning">{formatCurrency(seller.avgDiscount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
