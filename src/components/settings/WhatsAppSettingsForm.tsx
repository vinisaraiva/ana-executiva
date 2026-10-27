/**
 * @fileoverview Formulário de Gerenciamento de WhatsApp - DrGeFin
 * 
 * Permite gerenciar os números de WhatsApp autorizados para receber
 * relatórios e interagir com o assistente de IA.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Loader2, 
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Settings2,
  Pencil,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Formata número de telefone brasileiro para exibição
 */
function formatPhoneDisplay(phone: string): string {
  // Remove código do país se existir
  const digits = phone.replace(/\D/g, '').replace(/^55/, '');
  
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Formata input de telefone
 */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Normaliza telefone para formato de banco (55XXXXXXXXXXX)
 */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function WhatsAppSettingsForm() {
  const { tenant } = useTenant();
  const { isPlatformAdmin } = usePlatformAdmin();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [editingAccount, setEditingAccount] = useState<{ id: string; phone: string; name: string } | null>(null);

  // Busca números cadastrados
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['whatsapp-accounts', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Busca limite do plano atual
  const { data: maxWhatsappNumbers } = useQuery({
    queryKey: ['whatsapp-limit', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return 1;
      
      // Buscar plano do tenant
      const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('plan')
        .eq('tenant_id', tenant.id)
        .single();
      
      // Buscar limite do plano
      const { data: limits } = await supabase
        .from('plan_limits')
        .select('max_whatsapp_numbers')
        .eq('plan_name', subscription?.plan || 'trial')
        .single();
      
      return limits?.max_whatsapp_numbers ?? 1; // Default: 1
    },
    enabled: !!tenant?.id,
  });

  const currentCount = accounts?.length || 0;
  const canAddMore = maxWhatsappNumbers === null || currentCount < maxWhatsappNumbers;

  // Função auxiliar para verificar sessão e permissão
  const verifyPermission = async (tenantId: string): Promise<void> => {
    // 1. Verificar se a sessão está ativa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('SESSION_EXPIRED:Sua sessão expirou. Por favor, faça login novamente.');
    }
    
    // 2. Verificar se o usuário é admin/owner do tenant
    const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin', { 
      _tenant_id: tenantId 
    });
    
    if (isAdminError) {
      console.error('Erro ao verificar permissão:', isAdminError);
      throw new Error('PERMISSION_CHECK_FAILED:Não foi possível verificar sua permissão. Tente novamente.');
    }
    
    if (!isAdminResult) {
      throw new Error('NO_PERMISSION:Você não é Owner ou Admin desta empresa. Peça ao responsável para te adicionar como Admin.');
    }
  };

  // Função auxiliar para tratar erros customizados
  const handleMutationError = (error: Error, action: 'adicionar' | 'alterar' | 'remover') => {
    const msg = error.message;
    const errorLower = msg.toLowerCase();
    
    // Erros customizados com código
    if (msg.startsWith('SESSION_EXPIRED:')) {
      toast({
        title: 'Sessão expirada',
        description: msg.replace('SESSION_EXPIRED:', ''),
        variant: 'destructive',
      });
      return;
    }
    
    if (msg.startsWith('NO_PERMISSION:')) {
      toast({
        title: 'Sem permissão',
        description: msg.replace('NO_PERMISSION:', ''),
        variant: 'destructive',
      });
      return;
    }
    
    if (msg.startsWith('PERMISSION_CHECK_FAILED:')) {
      toast({
        title: 'Erro de verificação',
        description: msg.replace('PERMISSION_CHECK_FAILED:', ''),
        variant: 'destructive',
      });
      return;
    }
    
    // Número duplicado
    const isDuplicatePhone = errorLower.includes('whatsapp_accounts_phone_number_key') 
      || errorLower.includes('duplicate key');
    
    if (isDuplicatePhone) {
      toast({
        title: 'Número já cadastrado',
        description: 'Este número de WhatsApp já está vinculado a outra empresa. Cada número só pode estar em uma empresa por vez.',
        variant: 'destructive',
      });
      return;
    }
    
    // RLS (fallback se ainda chegar aqui)
    const isRLSError = errorLower.includes('row-level security') 
      || errorLower.includes('rls');
    
    if (isRLSError) {
      toast({
        title: 'Sem permissão',
        description: `Você não tem permissão para ${action} números nesta empresa.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Erro genérico
    toast({
      title: `Erro ao ${action}`,
      description: msg,
      variant: 'destructive',
    });
  };

  // Mutation para adicionar número
  const addMutation = useMutation({
    mutationFn: async ({ phone, name }: { phone: string; name: string }) => {
      if (!tenant?.id) throw new Error('Tenant não selecionado');
      
      // Verificar permissão ANTES de inserir
      await verifyPermission(tenant.id);
      
      const { error } = await supabase
        .from('whatsapp_accounts')
        .insert({
          tenant_id: tenant.id,
          phone_number: normalizePhone(phone),
          user_name: name || null,
          is_active: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts', tenant?.id] });
      setShowAddForm(false);
      setNewPhone('');
      setNewName('');
      toast({
        title: 'Número adicionado!',
        description: 'O número foi cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => handleMutationError(error, 'adicionar'),
  });

  // Mutation para atualizar status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (!tenant?.id) throw new Error('Tenant não selecionado');
      
      // Verificar permissão ANTES de atualizar
      await verifyPermission(tenant.id);
      
      const { error } = await supabase
        .from('whatsapp_accounts')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts', tenant?.id] });
    },
    onError: (error: Error) => handleMutationError(error, 'alterar'),
  });

  // Mutation para remover número
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenant?.id) throw new Error('Tenant não selecionado');
      
      // Verificar permissão ANTES de deletar
      await verifyPermission(tenant.id);
      
      const { error } = await supabase
        .from('whatsapp_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts', tenant?.id] });
      toast({
        title: 'Número removido',
        description: 'O número foi removido com sucesso.',
      });
    },
    onError: (error: Error) => handleMutationError(error, 'remover'),
  });

  // Mutation para atualizar número (trocar)
  const updateMutation = useMutation({
    mutationFn: async ({ id, phone, name }: { id: string; phone: string; name: string }) => {
      if (!tenant?.id) throw new Error('Tenant não selecionado');
      
      // Verificar permissão ANTES de atualizar
      await verifyPermission(tenant.id);
      
      const { error } = await supabase
        .from('whatsapp_accounts')
        .update({ 
          phone_number: normalizePhone(phone),
          user_name: name || null 
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts', tenant?.id] });
      setEditingAccount(null);
      toast({
        title: 'Número atualizado!',
        description: 'O número foi alterado com sucesso.',
      });
    },
    onError: (error: Error) => handleMutationError(error, 'alterar'),
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone || newPhone.replace(/\D/g, '').length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Informe um número de telefone válido.',
        variant: 'destructive',
      });
      return;
    }
    addMutation.mutate({ phone: newPhone, name: newName });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editingAccount.phone || editingAccount.phone.replace(/\D/g, '').length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Informe um número de telefone válido.',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({ 
      id: editingAccount.id, 
      phone: editingAccount.phone, 
      name: editingAccount.name 
    });
  };

  const startEditing = (account: { id: string; phone_number: string; user_name: string | null }) => {
    // Remove código do país para edição
    const digits = account.phone_number.replace(/\D/g, '').replace(/^55/, '');
    setEditingAccount({
      id: account.id,
      phone: formatPhone(digits),
      name: account.user_name || '',
    });
  };

  if (!tenant) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecione uma empresa para gerenciar os números de WhatsApp.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>WhatsApp</CardTitle>
              <CardDescription>
                Gerencie os números autorizados a receber relatórios pelo WhatsApp
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lista de números */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatPhoneDisplay(account.phone_number)}
                        </span>
                        {account.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {account.user_name && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {account.user_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(account)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={account.is_active}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ id: account.id, isActive: checked })
                      }
                      disabled={toggleMutation.isPending}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover número?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Este número não poderá mais receber relatórios pelo WhatsApp.
                            Você pode adicionar novamente depois.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum número cadastrado</p>
              <p className="text-sm">Adicione um número para começar a receber relatórios</p>
            </div>
          )}

          {/* Formulário de edição */}
          {editingAccount && (
            <form onSubmit={handleEditSubmit} className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Pencil className="h-4 w-4" />
                Editando número
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Número do WhatsApp</Label>
                  <Input
                    id="edit-phone"
                    placeholder="(71) 98756-6920"
                    value={editingAccount.phone}
                    onChange={(e) => setEditingAccount({ 
                      ...editingAccount, 
                      phone: formatPhone(e.target.value) 
                    })}
                    maxLength={16}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome do usuário (opcional)</Label>
                  <Input
                    id="edit-name"
                    placeholder="Ex: João Silva"
                    value={editingAccount.name}
                    onChange={(e) => setEditingAccount({ 
                      ...editingAccount, 
                      name: e.target.value 
                    })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAccount(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          )}

          {/* Formulário de adição */}
          {showAddForm && !editingAccount ? (
            <form onSubmit={handleAddSubmit} className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-phone">Número do WhatsApp</Label>
                  <Input
                    id="new-phone"
                    placeholder="(71) 98756-6920"
                    value={newPhone}
                    onChange={(e) => setNewPhone(formatPhone(e.target.value))}
                    maxLength={16}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-name">Nome do usuário (opcional)</Label>
                  <Input
                    id="new-name"
                    placeholder="Ex: João Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPhone('');
                    setNewName('');
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </div>
            </form>
          ) : !editingAccount && (
            canAddMore ? (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar número
              </Button>
            ) : (
              <div className="text-center py-4 px-6 rounded-lg border border-dashed bg-muted/30">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Limite de {maxWhatsappNumbers} número{maxWhatsappNumbers !== 1 ? 's' : ''} atingido
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para adicionar outro número, remova um existente ou faça upgrade do plano.
                </p>
              </div>
            )
          )}

          {/* Link para gerenciar comandos - apenas para admins da plataforma */}
          {isPlatformAdmin && (
            <div className="pt-4 border-t">
              <Button variant="outline" asChild className="w-full">
                <Link to="/app/settings/whatsapp-commands">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Gerenciar Comandos WhatsApp
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Apenas números cadastrados aqui podem interagir com o assistente pelo WhatsApp
          </p>
          <p>
            • Envie mensagens como <code className="bg-muted px-1 rounded">[status]</code>, <code className="bg-muted px-1 rounded">[relatório]</code> ou perguntas livres
          </p>
          <p>
            • Desative um número para pausar temporariamente o acesso
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
