/**
 * @fileoverview Página de Chat com IA - DrGeFin
 * 
 * Interface de chat conversacional com IA para análise de dados financeiros.
 * 
 * Funcionalidades:
 * - Envio de mensagens para a IA com contexto dos dados do tenant
 * - Streaming de respostas em tempo real (SSE)
 * - Persistência do histórico de conversa por sessão
 * - Sugestões rápidas para primeiras perguntas
 * - Medidor de uso de mensagens do plano
 * 
 * A IA tem acesso aos dados de vendas, KPIs e anomalias do tenant
 * para fornecer análises e insights personalizados.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { useChatHistory } from '@/hooks/useChatHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UsageMeter } from '@/components/UsageMeter';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Estrutura de uma mensagem no chat.
 */
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de chat com assistente de IA.
 * 
 * Permite ao usuário fazer perguntas sobre seus dados financeiros
 * e receber análises personalizadas em tempo real.
 */
export default function Chat() {
  const { tenant } = useTenant();
  const { session } = useAuth();
  
  // Hook customizado para gerenciar histórico de mensagens
  const { messages, setMessages, clearHistory, isInitialized } = useChatHistory(tenant?.id);
  
  // Estados locais
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref para scroll automático ao final das mensagens
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll automático quando novas mensagens são adicionadas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Envia mensagem para a Edge Function de chat.
   * Processa resposta via streaming (SSE) para atualização em tempo real.
   */
  const sendMessage = async () => {
    if (!input.trim() || !tenant || !session || isLoading) return;

    // Adiciona mensagem do usuário ao histórico
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Envia para Edge Function com histórico completo de mensagens
      const response = await fetch(
        `https://uhixhpdpmdehmeolwfen.supabase.co/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tenant_id: tenant.id,
            messages: [...messages, userMessage],
          }),
        }
      );

      // Trata erros HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (response.status === 402) {
          throw new Error(errorData.error || 'Limite de uso atingido. Faça upgrade para continuar.');
        }
        if (response.status === 403) {
          throw new Error(errorData.error || 'Acesso negado.');
        }
        throw new Error(errorData.error || 'Erro ao processar mensagem');
      }

      // Configura streaming de resposta
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let assistantContent = '';

      // Adiciona mensagem vazia do assistente (será preenchida via streaming)
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let textBuffer = '';

      // Processa chunks do stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Processa linhas completas do SSE
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          // Remove carriage return se presente
          if (line.endsWith('\r')) line = line.slice(0, -1);
          
          // Ignora comentários e linhas vazias
          if (line.startsWith(':') || line.trim() === '') continue;
          
          // Processa apenas linhas data:
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            // Extrai conteúdo do delta da resposta OpenAI
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              // Atualiza última mensagem com conteúdo acumulado
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            // JSON incompleto, devolve ao buffer e aguarda mais dados
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      // Remove mensagem vazia do assistente em caso de erro
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === 'assistant' && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler para atalho de teclado (Enter para enviar).
   * Shift+Enter permite nova linha.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Aguarda inicialização do histórico
  if (!isInitialized) {
    return (
      <AppLayout title="Chat IA">
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Chat IA">
      <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
        <Card className="flex-1 flex flex-col border-border/50 overflow-hidden">
          {/* Header com medidor de uso e botão de limpar */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            {tenant && (
              <UsageMeter tenantId={tenant.id} type="messages" className="flex-1 max-w-xs" />
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-muted-foreground hover:text-destructive ml-4"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar conversa
              </Button>
            )}
          </div>
          
          {/* Área de mensagens */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              // Estado inicial - sem mensagens
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Olá! Sou seu assistente financeiro
                </h3>
                <p className="text-center max-w-md">
                  Posso te ajudar a entender seus dados de vendas, KPIs e alertas detectados.
                  Faça uma pergunta para começar!
                </p>
                {/* Sugestões rápidas de perguntas */}
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {[
                    'Qual foi meu faturamento total?',
                    'Quais alertas devo verificar?',
                    'Como estão minhas vendas?',
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(suggestion);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // Histórico de mensagens
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {/* Avatar do assistente */}
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    {/* Balão da mensagem */}
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {/* Avatar do usuário */}
                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {/* Indicador de digitação (quando aguardando resposta) */}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input de mensagem */}
          <CardContent className="p-4 border-t border-border">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta sobre os dados financeiros..."
                className="min-h-[50px] max-h-[150px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="h-[50px] w-[50px] flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
