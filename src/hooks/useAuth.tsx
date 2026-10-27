/**
 * @fileoverview Hook de Autenticação - DrGeFin
 * 
 * Este arquivo gerencia toda a autenticação do sistema utilizando Supabase Auth.
 * Fornece contexto global para login, cadastro e logout de usuários.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface que define a estrutura do contexto de autenticação.
 * Contém o usuário, sessão e funções para manipular o estado de autenticação.
 */
interface AuthContextType {
  /** Usuário autenticado atualmente (null se não logado) */
  user: User | null;
  /** Sessão ativa do Supabase (null se não logado) */
  session: Session | null;
  /** Indica se está carregando o estado de autenticação */
  loading: boolean;
  /** Função para fazer login com email e senha */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  /** Função para criar nova conta com email, senha e metadados opcionais */
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; selected_plan?: string }) => Promise<{ error: Error | null }>;
  /** Função para fazer logout */
  signOut: () => Promise<void>;
}

// Criação do contexto com valor inicial undefined para forçar uso dentro do Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER DE AUTENTICAÇÃO
// ============================================================================

/**
 * Provider que envolve a aplicação e fornece o contexto de autenticação.
 * 
 * Funcionalidades:
 * - Configura listener para mudanças no estado de autenticação
 * - Verifica sessão existente no carregamento
 * - Fornece funções de login, cadastro e logout
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 * 
 * @example
 * // Em App.tsx ou main.tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Estados para controlar usuário, sessão e loading
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // IMPORTANTE: Configura o listener de mudança de estado PRIMEIRO
    // Isso evita race conditions onde podemos perder eventos de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Atualiza estados quando ocorre qualquer mudança de autenticação
        // (login, logout, refresh de token, etc.)
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // DEPOIS verifica se já existe uma sessão ativa
    // Importante fazer nesta ordem para não perder eventos
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup: remove o listener quando o componente desmonta
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Realiza login do usuário com email e senha.
   * 
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Objeto com erro (null se sucesso)
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  /**
   * Realiza cadastro de novo usuário.
   * 
   * Após o cadastro, um email de confirmação é enviado.
   * O usuário será redirecionado para /app após confirmar.
   * Também envia um email de boas-vindas com o número do WhatsApp.
   * 
   * @param email - Email do novo usuário
   * @param password - Senha escolhida
   * @param metadata - Dados adicionais (nome, sobrenome, plano escolhido)
   * @returns Objeto com erro (null se sucesso)
   */
  const signUp = async (
    email: string, 
    password: string,
    metadata?: { first_name?: string; last_name?: string; selected_plan?: string }
  ) => {
    // URL para onde o usuário será redirecionado após confirmar email
    const redirectUrl = `${window.location.origin}/app`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: redirectUrl,
        // Metadados são armazenados no perfil do usuário no Supabase
        data: {
          first_name: metadata?.first_name || '',
          last_name: metadata?.last_name || '',
          selected_plan: metadata?.selected_plan || 'starter',
        }
      }
    });

    // Se cadastro foi bem-sucedido, envia email de boas-vindas com WhatsApp
    if (!error && data.user) {
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: email,
            firstName: metadata?.first_name || '',
          }
        });
      } catch (emailError) {
        // Não retorna erro - o cadastro foi bem-sucedido
        console.error('Erro ao enviar email de boas-vindas:', emailError);
      }
    }

    return { error: error as Error | null };
  };

  /**
   * Realiza logout do usuário atual.
   * Limpa a sessão e redireciona para a página de login.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOK DE CONSUMO
// ============================================================================

/**
 * Hook para acessar o contexto de autenticação.
 * 
 * Fornece acesso ao usuário logado, sessão e funções de login/logout.
 * Deve ser usado dentro de um AuthProvider.
 * 
 * @returns Objeto com user, session, loading, signIn, signUp, signOut
 * @throws Error se usado fora do AuthProvider
 * 
 * @example
 * const { user, signIn, signOut } = useAuth();
 * 
 * // Verificar se está logado
 * if (user) {
 *   console.log('Usuário:', user.email);
 * }
 * 
 * // Fazer login
 * const { error } = await signIn('email@exemplo.com', 'senha123');
 * 
 * // Fazer logout
 * await signOut();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Garante que o hook está sendo usado dentro do AuthProvider
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}
