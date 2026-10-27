/**
 * @fileoverview Hook de Histórico do Chat IA - DrGeFin
 * 
 * Este arquivo gerencia o histórico de conversas do chat com IA.
 * O histórico é armazenado localmente no localStorage para persistência
 * entre sessões, separado por tenant (empresa).
 * 
 * Características:
 * - Limite de 10 mensagens no histórico (para contexto do modelo)
 * - Persistência local por tenant
 * - Limpeza automática ao trocar de tenant
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interface que representa uma mensagem do chat.
 */
interface Message {
  /** Papel do autor: 'user' (usuário) ou 'assistant' (IA) */
  role: 'user' | 'assistant';
  /** Conteúdo da mensagem em texto */
  content: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Limite máximo de mensagens mantidas no histórico.
 * Este valor é usado para limitar o contexto enviado para a IA
 * e também para não sobrecarregar o localStorage.
 */
const MAX_MESSAGES = 10;

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para gerenciar o histórico de conversas do chat IA.
 * 
 * O histórico é separado por tenant, permitindo que cada empresa
 * tenha seu próprio contexto de conversa. As mensagens são
 * persistidas no localStorage.
 * 
 * @param tenantId - ID do tenant atual (undefined se não selecionado)
 * @returns Objeto com messages, setMessages, clearHistory e isInitialized
 * 
 * @example
 * const { messages, setMessages, clearHistory } = useChatHistory(tenant?.id);
 * 
 * // Adicionar mensagem do usuário
 * setMessages([...messages, { role: 'user', content: 'Olá!' }]);
 * 
 * // Limpar histórico
 * clearHistory();
 */
export function useChatHistory(tenantId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  // EFEITO: Carregar histórico do localStorage
  // ============================================================================

  useEffect(() => {
    // Se não há tenant, limpa as mensagens
    if (!tenantId) {
      setMessages([]);
      setIsInitialized(true);
      return;
    }

    // Chave única no localStorage baseada no tenant
    const key = `chat_history_${tenantId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        // Tenta parsear o JSON salvo
        const parsed = JSON.parse(saved) as Message[];
        // Mantém apenas as últimas MAX_MESSAGES mensagens
        setMessages(parsed.slice(-MAX_MESSAGES));
      } catch {
        // Se o JSON estiver corrompido, inicia com array vazio
        setMessages([]);
      }
    }
    
    setIsInitialized(true);
  }, [tenantId]);

  // ============================================================================
  // EFEITO: Salvar histórico no localStorage
  // ============================================================================

  useEffect(() => {
    // Só salva após inicialização e se houver tenant
    if (!tenantId || !isInitialized) return;

    const key = `chat_history_${tenantId}`;
    // Mantém apenas as últimas MAX_MESSAGES antes de salvar
    const toSave = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(key, JSON.stringify(toSave));
  }, [messages, tenantId, isInitialized]);

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  /**
   * Limpa todo o histórico de conversas do tenant atual.
   * Remove do localStorage e limpa o estado.
   */
  const clearHistory = useCallback(() => {
    if (!tenantId) return;
    
    const key = `chat_history_${tenantId}`;
    localStorage.removeItem(key);
    setMessages([]);
  }, [tenantId]);

  return { 
    /** Array de mensagens do histórico */
    messages, 
    /** Função para atualizar as mensagens */
    setMessages, 
    /** Função para limpar todo o histórico */
    clearHistory,
    /** Indica se o histórico foi carregado do localStorage */
    isInitialized 
  };
}
