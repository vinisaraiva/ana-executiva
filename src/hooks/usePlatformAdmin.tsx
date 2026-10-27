/**
 * @fileoverview Hook de Verificação de Admin da Plataforma - DrGeFin
 * 
 * Este arquivo gerencia a verificação se o usuário atual é um
 * administrador da plataforma (super admin).
 * 
 * Administradores de plataforma têm acesso a:
 * - Painel administrativo (/admin)
 * - Gerenciamento de todos os tenants
 * - Configurações globais do sistema
 * - Logs de auditoria
 * - Gerenciamento de planos e limites
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface que define a estrutura do contexto de admin de plataforma.
 */
interface PlatformAdminContextType {
  /** Indica se o usuário atual é admin da plataforma */
  isPlatformAdmin: boolean;
  /** Indica se está verificando o status de admin */
  loading: boolean;
}

// Criação do contexto com valores padrão seguros (não é admin por padrão)
const PlatformAdminContext = createContext<PlatformAdminContextType>({
  isPlatformAdmin: false,
  loading: true,
});

// ============================================================================
// PROVIDER DE ADMIN DE PLATAFORMA
// ============================================================================

/**
 * Provider que verifica e fornece o status de admin de plataforma.
 * 
 * A verificação é feita consultando a tabela platform_admins no Supabase.
 * Por segurança, assume-se que o usuário NÃO é admin até que seja confirmado.
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 * 
 * @example
 * // Em App.tsx, após AuthProvider
 * <AuthProvider>
 *   <PlatformAdminProvider>
 *     <App />
 *   </PlatformAdminProvider>
 * </AuthProvider>
 */
export function PlatformAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Verifica se o usuário atual está na tabela platform_admins.
     * Usa maybeSingle() porque pode não existir registro.
     */
    const checkAdmin = async () => {
      // Sem usuário logado = não é admin
      if (!user) {
        setIsPlatformAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Usa RPC para evitar problemas de RLS recursiva
        const { data, error } = await supabase.rpc('is_platform_admin');

        if (error) {
          console.error('Erro ao verificar admin de plataforma:', error);
          setIsPlatformAdmin(false);
        } else {
          // A função retorna boolean diretamente
          setIsPlatformAdmin(data === true);
        }
      } catch (err) {
        console.error('Erro ao verificar admin de plataforma:', err);
        setIsPlatformAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]); // Reexecuta quando o usuário muda

  return (
    <PlatformAdminContext.Provider value={{ isPlatformAdmin, loading }}>
      {children}
    </PlatformAdminContext.Provider>
  );
}

// ============================================================================
// HOOK DE CONSUMO
// ============================================================================

/**
 * Hook para verificar se o usuário atual é admin da plataforma.
 * 
 * @returns Objeto com isPlatformAdmin e loading
 * 
 * @example
 * const { isPlatformAdmin, loading } = usePlatformAdmin();
 * 
 * if (loading) return <Spinner />;
 * 
 * if (isPlatformAdmin) {
 *   // Mostrar opções de admin
 * }
 */
export function usePlatformAdmin() {
  return useContext(PlatformAdminContext);
}
