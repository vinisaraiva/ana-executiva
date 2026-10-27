/**
 * @fileoverview Hook de Gerenciamento de Tenants (Empresas) - DrGeFin
 * 
 * Este arquivo gerencia o contexto de multi-tenancy do sistema.
 * Cada usuário pode pertencer a múltiplos tenants (empresas) e
 * selecionar qual tenant está ativo no momento.
 * 
 * Conceitos importantes:
 * - Tenant: Representa uma empresa/organização no sistema
 * - Membership: Vínculo entre um usuário e um tenant (com role)
 * - Tenant ativo: O tenant selecionado atualmente para operações
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

// Tipo do tenant baseado no schema do Supabase
type Tenant = Tables<'tenants'>;

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface que define a estrutura do contexto de tenant.
 * Contém o tenant ativo, lista de tenants e funções de gerenciamento.
 */
interface TenantContextType {
  /** Tenant atualmente selecionado/ativo */
  tenant: Tenant | null;
  /** Lista de todos os tenants que o usuário tem acesso */
  tenants: Tenant[];
  /** Indica se está carregando os dados de tenants */
  loading: boolean;
  /** Função para selecionar/trocar o tenant ativo */
  selectTenant: (tenantId: string) => void;
  /** Função para criar um novo tenant com WhatsApp opcional */
  createTenant: (name: string, sector?: string, whatsappPhone?: string, userName?: string) => Promise<{ error: Error | null; tenant: Tenant | null }>;
  /** Função para recarregar a lista de tenants */
  refetch: () => Promise<void>;
}

// Criação do contexto com valor inicial undefined
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ============================================================================
// PROVIDER DE TENANT
// ============================================================================

/**
 * Provider que gerencia o estado de multi-tenancy da aplicação.
 * 
 * Funcionalidades:
 * - Carrega lista de tenants do usuário autenticado
 * - Persiste o tenant selecionado no localStorage
 * - Auto-seleciona o primeiro tenant se nenhum estiver salvo
 * - Permite criar novos tenants
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 * 
 * @example
 * // Geralmente usado junto com AuthProvider em App.tsx
 * <AuthProvider>
 *   <TenantProvider>
 *     <App />
 *   </TenantProvider>
 * </AuthProvider>
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Busca todos os tenants que o usuário tem acesso.
   * A filtragem por RLS (Row Level Security) é feita automaticamente
   * pelo Supabase baseado no user_id da sessão.
   */
  const fetchTenants = async () => {
    // Se não há usuário logado, limpa os estados
    if (!user) {
      setTenants([]);
      setTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Busca tenants ordenados pelo mais recente primeiro
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar tenants:', error);
      setLoading(false);
      return;
    }

    setTenants(data || []);
    
    // Lógica de auto-seleção de tenant:
    // 1. Tenta recuperar o tenant salvo no localStorage
    // 2. Se não encontrar, seleciona o primeiro da lista
    const savedTenantId = localStorage.getItem('selected_tenant_id');
    const savedTenant = data?.find(t => t.id === savedTenantId);
    
    if (savedTenant) {
      // Tenant salvo encontrado - usa ele
      setTenant(savedTenant);
    } else if (data && data.length > 0) {
      // Nenhum salvo - usa o primeiro e salva no localStorage
      setTenant(data[0]);
      localStorage.setItem('selected_tenant_id', data[0].id);
    }
    
    setLoading(false);
  };

  // Recarrega tenants quando o usuário muda (login/logout)
  useEffect(() => {
    fetchTenants();
  }, [user]);

  /**
   * Seleciona um tenant como ativo.
   * Salva a escolha no localStorage para persistência entre sessões.
   * 
   * @param tenantId - ID do tenant a ser selecionado
   */
  const selectTenant = (tenantId: string) => {
    const selected = tenants.find(t => t.id === tenantId);
    if (selected) {
      setTenant(selected);
      localStorage.setItem('selected_tenant_id', tenantId);
    }
  };

  /**
   * Cria um novo tenant e automaticamente cria o membership do usuário.
   * O trigger no banco cria automaticamente o membership com role 'owner'.
   * 
   * @param name - Nome do tenant (empresa)
   * @param sector - Setor de atuação (opcional)
   * @param whatsappPhone - Número de WhatsApp no formato 5571987566920 (opcional)
   * @param userName - Nome do usuário para vincular ao WhatsApp (opcional)
   * @returns Objeto com erro (null se sucesso) e o tenant criado
   */
  const createTenant = async (
    name: string, 
    sector?: string, 
    whatsappPhone?: string,
    userName?: string
  ): Promise<{ error: Error | null; tenant: Tenant | null }> => {
    if (!user) {
      return { error: new Error('Usuário não autenticado'), tenant: null };
    }

    // Insere sem .select() para evitar conflito de RLS no RETURNING
    // O RLS só permite leitura após o membership ser criado pelo trigger
    const { error } = await supabase
      .from('tenants')
      .insert({ name, sector, created_by: user.id });

    if (error) {
      return { error: error as Error, tenant: null };
    }

    // Recarrega a lista de tenants - agora o membership existe e RLS permite leitura
    const { data: refreshedTenants } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (refreshedTenants) {
      setTenants(refreshedTenants);
      
      // Auto-seleciona o tenant recém-criado (mais recente com o mesmo nome)
      const created = refreshedTenants.find(t => t.name === name && t.created_by === user.id);
      if (created) {
        setTenant(created);
        localStorage.setItem('selected_tenant_id', created.id);

        // Se telefone foi informado, cadastra na tabela whatsapp_accounts
        if (whatsappPhone) {
          const { error: whatsappError } = await supabase
            .from('whatsapp_accounts')
            .insert({
              tenant_id: created.id,
              phone_number: whatsappPhone,
              user_name: userName || null,
              is_active: true,
            });

          if (whatsappError) {
            console.error('Erro ao cadastrar WhatsApp:', whatsappError);
            // Não retorna erro pois o tenant foi criado com sucesso
          }
        }

        return { error: null, tenant: created };
      }
    }

    return { error: null, tenant: null };
  };

  return (
    <TenantContext.Provider value={{ tenant, tenants, loading, selectTenant, createTenant, refetch: fetchTenants }}>
      {children}
    </TenantContext.Provider>
  );
}

// ============================================================================
// HOOK DE CONSUMO
// ============================================================================

/**
 * Hook para acessar o contexto de tenant.
 * 
 * Fornece acesso ao tenant ativo, lista de tenants e funções de gerenciamento.
 * Deve ser usado dentro de um TenantProvider.
 * 
 * @returns Objeto com tenant, tenants, loading, selectTenant, createTenant, refetch
 * @throws Error se usado fora do TenantProvider
 * 
 * @example
 * const { tenant, tenants, selectTenant, createTenant } = useTenant();
 * 
 * // Verificar tenant ativo
 * console.log('Empresa atual:', tenant?.name);
 * 
 * // Trocar de tenant
 * selectTenant('outro-tenant-id');
 * 
 * // Criar novo tenant
 * const { error, tenant: newTenant } = await createTenant('Nova Empresa', 'Varejo');
 */
export function useTenant() {
  const context = useContext(TenantContext);
  
  // Garante que o hook está sendo usado dentro do TenantProvider
  if (context === undefined) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  
  return context;
}
