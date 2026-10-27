/**
 * @fileoverview Hook de IDs de Importações Válidas - DrGeFin
 * 
 * Este hook é fundamental para garantir que apenas dados de importações
 * válidas (status='done' e is_active=true) sejam exibidos no dashboard
 * e outras análises.
 * 
 * Importância:
 * - Evita exibir dados de importações ainda em processamento
 * - Respeita a flag is_active para permitir "desativar" importações
 * - Usado como filtro base em todas as queries de sales_lines
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para buscar IDs de importações válidas (concluídas e ativas).
 * 
 * Critérios de validez:
 * - status = 'done' (processamento concluído com sucesso)
 * - is_active = true (não foi desativada pelo usuário)
 * 
 * O resultado é usado como filtro .in('import_run_id', validImportIds)
 * em todas as queries de sales_lines para garantir consistência.
 * 
 * @param tenantId - ID do tenant para filtrar importações
 * @returns Query result com array de IDs válidos
 * 
 * @example
 * const { data: validImportIds = [], isLoading } = useValidImportIds(tenant?.id);
 * 
 * // Usar em queries de sales_lines
 * const { data: sales } = await supabase
 *   .from('sales_lines')
 *   .select('*')
 *   .eq('tenant_id', tenantId)
 *   .in('import_run_id', validImportIds);
 */
export function useValidImportIds(tenantId: string | undefined) {
  return useQuery({
    // Chave única para cache do React Query
    queryKey: ['valid-import-ids', tenantId],
    
    queryFn: async () => {
      // Retorna array vazio se não houver tenant
      if (!tenantId) return [];
      
      // Busca apenas IDs de importações válidas
      const { data, error } = await supabase
        .from('import_runs')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)    // Apenas importações ativas
        .eq('status', 'done');    // Apenas importações concluídas

      if (error) throw error;
      
      // Retorna array de IDs (strings UUID)
      return data?.map(r => r.id) || [];
    },
    
    // Só executa se houver tenantId
    enabled: !!tenantId,
    
    // Cache de 30 segundos para evitar chamadas repetidas
    // Importações não mudam com frequência, então cache é seguro
    staleTime: 30000,
  });
}
