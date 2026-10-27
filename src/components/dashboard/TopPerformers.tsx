/**
 * @fileoverview Rankings de Top Produtos e Vendedores - DrGeFin
 * 
 * Componente que exibe dois rankings:
 * - Top 5 Produtos por faturamento
 * - Top 5 Vendedores por faturamento
 * 
 * Cada item exibe:
 * - Posição no ranking (1-5)
 * - Nome do produto/vendedor
 * - Valor total de vendas
 * - Barra de progresso proporcional
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um item no ranking.
 */
interface PerformerItem {
  /** Nome do produto ou vendedor */
  name: string;
  /** Valor total de vendas */
  value: number;
  /** Percentual (opcional, para uso futuro) */
  percentage?: number;
}

/**
 * Propriedades do componente TopPerformers.
 */
interface TopPerformersProps {
  /** Lista de produtos ordenados por faturamento (desc) */
  products: PerformerItem[];
  /** Lista de vendedores ordenados por faturamento (desc) */
  sellers: PerformerItem[];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de rankings de top performers.
 * 
 * Exibe dois cards com rankings de produtos e vendedores,
 * cada um mostrando os top 5 por faturamento com barras de progresso.
 * 
 * @example
 * ```tsx
 * <TopPerformers
 *   products={[
 *     { name: 'Produto A', value: 50000 },
 *     { name: 'Produto B', value: 35000 },
 *   ]}
 *   sellers={[
 *     { name: 'João', value: 80000 },
 *     { name: 'Maria', value: 65000 },
 *   ]}
 * />
 * ```
 */
export function TopPerformers({ products, sellers }: TopPerformersProps) {
  /**
   * Formata valor numérico como moeda brasileira.
   * @param value - Valor a ser formatado
   * @returns String formatada (ex: "R$ 50.000,00")
   */
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Calcula valores máximos para proporcionalidade das barras
  const maxProductValue = Math.max(...products.map(p => p.value), 1);
  const maxSellerValue = Math.max(...sellers.map(s => s.value), 1);

  // Verifica se há dados para exibir
  const hasData = products.length > 0 || sellers.length > 0;

  // Não renderiza se não houver dados
  if (!hasData) {
    return null;
  }

  return (
    <div className="grid gap-6 grid-cols-1">
      {/* Card: Top 5 Produtos */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Top 5 Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.length > 0 ? (
            products.slice(0, 5).map((product, index) => (
              <div key={product.name} className="space-y-1">
                {/* Linha do item: posição, nome e valor */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {/* Badge de posição com cores especiais para top 3 */}
                    <span className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 && "bg-warning/20 text-warning",     // Ouro
                      index === 1 && "bg-muted text-muted-foreground", // Prata
                      index === 2 && "bg-accent/20 text-accent",       // Bronze
                      index > 2 && "bg-muted/50 text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    {/* Nome do produto (truncado se longo) */}
                    <span className="font-medium truncate max-w-[150px]">{product.name}</span>
                  </div>
                  {/* Valor formatado */}
                  <span className="text-muted-foreground">{formatCurrency(product.value)}</span>
                </div>
                {/* Barra de progresso proporcional */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      index === 0 && "bg-primary",
                      index === 1 && "bg-primary/80",
                      index === 2 && "bg-primary/60",
                      index > 2 && "bg-primary/40"
                    )}
                    style={{ width: `${(product.value / maxProductValue) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados de produtos</p>
          )}
        </CardContent>
      </Card>

      {/* Card: Top 5 Vendedores */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            Top 5 Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sellers.length > 0 ? (
            sellers.slice(0, 5).map((seller, index) => (
              <div key={seller.name} className="space-y-1">
                {/* Linha do item: avatar, nome e valor */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {/* Avatar com ícone de usuário e cores por posição */}
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center",
                      index === 0 && "bg-warning/20",
                      index === 1 && "bg-muted",
                      index === 2 && "bg-accent/20",
                      index > 2 && "bg-muted/50"
                    )}>
                      <User className={cn(
                        "h-3 w-3",
                        index === 0 && "text-warning",
                        index === 1 && "text-muted-foreground",
                        index === 2 && "text-accent",
                        index > 2 && "text-muted-foreground"
                      )} />
                    </div>
                    {/* Nome do vendedor (truncado se longo) */}
                    <span className="font-medium truncate max-w-[150px]">{seller.name}</span>
                  </div>
                  {/* Valor formatado */}
                  <span className="text-muted-foreground">{formatCurrency(seller.value)}</span>
                </div>
                {/* Barra de progresso proporcional */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      index === 0 && "bg-warning",
                      index === 1 && "bg-warning/80",
                      index === 2 && "bg-warning/60",
                      index > 2 && "bg-warning/40"
                    )}
                    style={{ width: `${(seller.value / maxSellerValue) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados de vendedores</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
