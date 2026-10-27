/**
 * @fileoverview Sistema de Notificações Toast - DrGeFin
 * 
 * Este arquivo implementa um sistema de toasts (notificações flutuantes)
 * usando o padrão de gerenciamento de estado com reducer.
 * 
 * Características:
 * - Suporta múltiplos toasts simultâneos (limitado a 1 por padrão)
 * - Auto-dismiss configurável
 * - Suporte a ações (botões) nos toasts
 * - Variantes visuais (default, destructive)
 * 
 * Baseado no componente Toast do shadcn/ui com customizações.
 * 
 * @author DrGeFin Team (baseado em shadcn/ui)
 * @since 1.0.0
 */

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Limite máximo de toasts exibidos simultaneamente.
 * Toasts antigos são removidos quando o limite é atingido.
 */
const TOAST_LIMIT = 1;

/**
 * Delay em milissegundos para remover um toast após ser dismissado.
 * Valor alto para permitir animações de saída.
 */
const TOAST_REMOVE_DELAY = 1000000;

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Tipo que estende ToastProps com campos adicionais para gerenciamento.
 */
type ToasterToast = ToastProps & {
  /** Identificador único do toast */
  id: string;
  /** Título do toast (opcional) */
  title?: React.ReactNode;
  /** Descrição/mensagem do toast (opcional) */
  description?: React.ReactNode;
  /** Elemento de ação (botão) do toast (opcional) */
  action?: ToastActionElement;
};

// Tipos de ações disponíveis para o reducer
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

// Contador para gerar IDs únicos
let count = 0;

/**
 * Gera um ID único para cada toast.
 * Usa contador circular para evitar overflow.
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

// Union type de todas as ações possíveis
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

// Estado do gerenciador de toasts
interface State {
  toasts: ToasterToast[];
}

// ============================================================================
// GERENCIAMENTO DE TIMEOUTS
// ============================================================================

/**
 * Map para armazenar timeouts de remoção de toasts.
 * Permite cancelar a remoção se necessário.
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Adiciona um toast à fila de remoção.
 * Após TOAST_REMOVE_DELAY, o toast é removido definitivamente.
 * 
 * @param toastId - ID do toast a ser removido
 */
const addToRemoveQueue = (toastId: string) => {
  // Evita duplicar timeouts
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Reducer para gerenciar o estado dos toasts.
 * Processa ações de adicionar, atualizar, dismissar e remover toasts.
 * 
 * @param state - Estado atual
 * @param action - Ação a ser processada
 * @returns Novo estado
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Adiciona novo toast no início e respeita o limite
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      // Atualiza um toast existente pelo ID
      return {
        ...state,
        toasts: state.toasts.map((t) => 
          (t.id === action.toast.id ? { ...t, ...action.toast } : t)
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Agenda remoção do(s) toast(s)
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        // Se não especificar ID, dismissar todos
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      // Marca toast(s) como fechado(s) para animação de saída
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    
    case "REMOVE_TOAST":
      // Remove definitivamente o toast do estado
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// ============================================================================
// ESTADO GLOBAL E DISPATCH
// ============================================================================

/**
 * Lista de listeners que serão notificados quando o estado mudar.
 * Permite que múltiplos componentes reajam às mudanças.
 */
const listeners: Array<(state: State) => void> = [];

/**
 * Estado mantido em memória (fora do React).
 * Isso permite chamar toast() de qualquer lugar, não apenas em componentes.
 */
let memoryState: State = { toasts: [] };

/**
 * Dispara uma ação para atualizar o estado e notifica os listeners.
 * 
 * @param action - Ação a ser disparada
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

type Toast = Omit<ToasterToast, "id">;

/**
 * Exibe um novo toast na tela.
 * Pode ser chamado de qualquer lugar, não apenas em componentes React.
 * 
 * @param props - Propriedades do toast (title, description, variant, etc.)
 * @returns Objeto com id, dismiss e update para controlar o toast
 * 
 * @example
 * // Toast simples
 * toast({ title: 'Sucesso!', description: 'Operação concluída.' });
 * 
 * // Toast de erro
 * toast({ 
 *   title: 'Erro', 
 *   description: 'Algo deu errado.', 
 *   variant: 'destructive' 
 * });
 * 
 * // Toast com ação
 * toast({
 *   title: 'Item deletado',
 *   action: <Button onClick={undo}>Desfazer</Button>
 * });
 */
function toast({ ...props }: Toast) {
  const id = genId();

  // Função para atualizar o toast depois de criado
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
    
  // Função para fechar o toast
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * Hook para usar o sistema de toasts em componentes React.
 * Retorna o estado atual e funções para gerenciar toasts.
 * 
 * @returns Objeto com toasts, toast() e dismiss()
 * 
 * @example
 * const { toast, dismiss } = useToast();
 * 
 * // Exibir toast
 * const { id } = toast({ title: 'Olá!' });
 * 
 * // Fechar toast específico
 * dismiss(id);
 * 
 * // Fechar todos os toasts
 * dismiss();
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    // Registra este componente como listener
    listeners.push(setState);
    
    // Cleanup: remove listener quando componente desmonta
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
