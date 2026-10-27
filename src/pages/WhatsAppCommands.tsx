/**
 * @fileoverview Página de gerenciamento de comandos WhatsApp
 * 
 * Permite administradores da plataforma configurarem comandos globais
 * disponíveis para interação via WhatsApp.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { 
  MessageCircle, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Globe,
  ArrowLeft,
  GripVertical,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface WhatsAppCommand {
  id: string;
  command_key: string;
  command_aliases: string[];
  display_name: string;
  description: string | null;
  icon: string;
  response_type: 'template' | 'data_query' | 'ai_prompt';
  response_template: string | null;
  data_source: string | null;
  limit_items: number | null;
  ai_prompt: string | null;
  is_active: boolean;
  sort_order: number;
}

const RESPONSE_TYPES = [
  { value: 'template', label: 'Template', description: 'Resposta pré-definida com variáveis' },
  { value: 'data_query', label: 'Consulta de Dados', description: 'Busca dados específicos do sistema' },
  { value: 'ai_prompt', label: 'Prompt IA', description: 'Resposta gerada por IA com prompt específico' },
];

const COMMON_DATA_SOURCES = [
  { value: 'empresa', label: 'KPIs da Empresa' },
  { value: 'vendedores.ranking_faturamento', label: 'Top Vendedores (Faturamento)' },
  { value: 'vendedores.bottom_20_faturamento', label: 'Piores Vendedores (Faturamento)' },
  { value: 'produtos.top_20_faturamento', label: 'Top Produtos (Faturamento)' },
  { value: 'produtos.bottom_20_margem', label: 'Piores Produtos (Margem)' },
  { value: 'clientes.top_20_faturamento', label: 'Top Clientes (Faturamento)' },
  { value: 'clientes.top_20_frequencia', label: 'Top Clientes (Frequência)' },
  { value: 'temporal', label: 'Análise Temporal' },
  { value: 'canais', label: 'Canais de Venda' },
  { value: 'cidades.top_20', label: 'Top Cidades' },
  { value: 'produtos.curva_abc', label: 'Curva ABC' },
  { value: 'anomalies', label: 'Alertas/Anomalias' },
];

const EMOJI_OPTIONS = ['📊', '📈', '📉', '👥', '📦', '🏆', '💰', '⚠️', '❓', '🏪', '🏙️', '📅', '🔔', '✨', '🧹'];

function CommandEditor({
  command,
  onSave,
  onClose,
  isSaving,
}: {
  command: WhatsAppCommand | null;
  onSave: (data: Partial<WhatsAppCommand>) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<WhatsAppCommand>>({
    command_key: command?.command_key || '',
    command_aliases: command?.command_aliases || [],
    display_name: command?.display_name || '',
    description: command?.description || '',
    icon: command?.icon || '📊',
    response_type: command?.response_type || 'data_query',
    response_template: command?.response_template || '',
    data_source: command?.data_source || '',
    limit_items: command?.limit_items || 10,
    ai_prompt: command?.ai_prompt || '',
    is_active: command?.is_active ?? true,
    sort_order: command?.sort_order || 0,
  });

  const [aliasInput, setAliasInput] = useState('');

  // Sincronizar formData quando command mudar
  useEffect(() => {
    setFormData({
      command_key: command?.command_key || '',
      command_aliases: command?.command_aliases || [],
      display_name: command?.display_name || '',
      description: command?.description || '',
      icon: command?.icon || '📊',
      response_type: command?.response_type || 'data_query',
      response_template: command?.response_template || '',
      data_source: command?.data_source || '',
      limit_items: command?.limit_items || 10,
      ai_prompt: command?.ai_prompt || '',
      is_active: command?.is_active ?? true,
      sort_order: command?.sort_order || 0,
    });
  }, [command]);

  const handleAddAlias = () => {
    if (aliasInput.trim()) {
      setFormData({
        ...formData,
        command_aliases: [...(formData.command_aliases || []), aliasInput.trim()],
      });
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (index: number) => {
    const newAliases = [...(formData.command_aliases || [])];
    newAliases.splice(index, 1);
    setFormData({ ...formData, command_aliases: newAliases });
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {command ? 'Editar Comando' : 'Novo Comando'}
          <Badge variant="outline" className="ml-2">Global</Badge>
        </DialogTitle>
        <DialogDescription>
          Configure como o comando será processado e exibido
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="command_key">Chave do Comando *</Label>
            <Input
              id="command_key"
              placeholder="ex: status"
              value={formData.command_key}
              onChange={(e) => setFormData({ ...formData, command_key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              disabled={!!command}
            />
            <p className="text-xs text-muted-foreground">Identificador único (sem espaços)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Nome de Exibição *</Label>
            <Input
              id="display_name"
              placeholder="ex: Status Rápido"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Ícone</Label>
            <Select
              value={formData.icon}
              onValueChange={(v) => setFormData({ ...formData, icon: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMOJI_OPTIONS.map((emoji) => (
                  <SelectItem key={emoji} value={emoji}>
                    <span className="text-lg">{emoji}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição curta do comando"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Aliases */}
        <div className="space-y-2">
          <Label>Aliases (palavras alternativas)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="ex: [status]"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAlias())}
            />
            <Button type="button" variant="outline" onClick={handleAddAlias}>
              Adicionar
            </Button>
          </div>
          {formData.command_aliases && formData.command_aliases.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.command_aliases.map((alias, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {alias}
                  <button
                    type="button"
                    onClick={() => handleRemoveAlias(i)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Response Type */}
        <div className="space-y-2">
          <Label>Tipo de Resposta</Label>
          <Select
            value={formData.response_type}
            onValueChange={(v) => setFormData({ ...formData, response_type: v as WhatsAppCommand['response_type'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESPONSE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <span className="font-medium">{type.label}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conditional Fields based on response_type */}
        {formData.response_type === 'data_query' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Fonte de Dados</Label>
              <Select
                value={formData.data_source || ''}
                onValueChange={(v) => setFormData({ ...formData, data_source: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_DATA_SOURCES.map((src) => (
                    <SelectItem key={src.value} value={src.value}>
                      {src.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit_items">Limite de Itens</Label>
              <Input
                id="limit_items"
                type="number"
                min={1}
                max={50}
                value={formData.limit_items || ''}
                onChange={(e) => setFormData({ ...formData, limit_items: parseInt(e.target.value) || null })}
              />
            </div>
          </div>
        )}

        {formData.response_type === 'template' && (
          <div className="space-y-2">
            <Label htmlFor="response_template">Template de Resposta</Label>
            <Textarea
              id="response_template"
              placeholder="Use variáveis como {faturamento}, {pedidos}, etc."
              value={formData.response_template || ''}
              onChange={(e) => setFormData({ ...formData, response_template: e.target.value })}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{faturamento}'}, {'{pedidos}'}, {'{ticket_medio}'}, {'{margem}'}
            </p>
          </div>
        )}

        {formData.response_type === 'ai_prompt' && (
          <div className="space-y-2">
            <Label htmlFor="ai_prompt">Prompt para IA</Label>
            <Textarea
              id="ai_prompt"
              placeholder="Instruções específicas para a IA responder este comando..."
              value={formData.ai_prompt || ''}
              onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
              rows={6}
            />
          </div>
        )}

        {/* Active & Sort */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
            />
            <Label htmlFor="is_active">Comando ativo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort_order">Ordem:</Label>
            <Input
              id="sort_order"
              type="number"
              className="w-20"
              value={formData.sort_order || 0}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={() => onSave(formData)} 
          disabled={!formData.command_key || !formData.display_name || isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CommandsList({
  commands,
  onEdit,
  onDelete,
  onToggle,
  isDeleting,
}: {
  commands: WhatsAppCommand[];
  onEdit: (cmd: WhatsAppCommand) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  isDeleting: boolean;
}) {
  if (commands.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum comando global encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {commands.map((cmd) => (
        <div
          key={cmd.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GripVertical className="h-4 w-4" />
              <span className="text-2xl">{cmd.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{cmd.display_name}</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cmd.command_key}</code>
                {!cmd.is_active && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inativo
                  </Badge>
                )}
              </div>
              {cmd.description && (
                <p className="text-sm text-muted-foreground">{cmd.description}</p>
              )}
              {cmd.command_aliases && cmd.command_aliases.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {cmd.command_aliases.map((alias, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {alias}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {cmd.response_type === 'template' ? 'Template' : 
               cmd.response_type === 'data_query' ? 'Dados' : 'IA'}
            </Badge>
            <Switch
              checked={cmd.is_active}
              onCheckedChange={(checked) => onToggle(cmd.id, checked)}
            />
            <Button variant="ghost" size="icon" onClick={() => onEdit(cmd)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir comando?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O comando "{cmd.display_name}" será removido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(cmd.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WhatsAppCommands() {
  const { isPlatformAdmin, loading: loadingAdmin } = usePlatformAdmin();
  const queryClient = useQueryClient();
  const [editingCommand, setEditingCommand] = useState<WhatsAppCommand | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch global commands
  const { data: globalCommands = [], isLoading: loadingCommands } = useQuery({
    queryKey: ['whatsapp-commands-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_commands_global')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as WhatsAppCommand[];
    },
    enabled: isPlatformAdmin,
  });

  // Save mutation for global commands
  const saveGlobalMutation = useMutation({
    mutationFn: async (data: Partial<WhatsAppCommand>) => {
      if (editingCommand) {
        const { error } = await supabase
          .from('whatsapp_commands_global')
          .update(data)
          .eq('id', editingCommand.id);
        if (error) throw error;
      } else {
        const insertData = {
          command_key: data.command_key!,
          display_name: data.display_name!,
          command_aliases: data.command_aliases || [],
          description: data.description || null,
          icon: data.icon || '📊',
          response_type: data.response_type || 'template',
          response_template: data.response_template || null,
          data_source: data.data_source || null,
          limit_items: data.limit_items || null,
          ai_prompt: data.ai_prompt || null,
          is_active: data.is_active ?? true,
          sort_order: data.sort_order || 0,
        };
        const { error } = await supabase
          .from('whatsapp_commands_global')
          .insert(insertData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-commands-global'] });
      setEditingCommand(null);
      setIsCreating(false);
      toast({ title: 'Comando salvo!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteGlobalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_commands_global').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-commands-global'] });
      toast({ title: 'Comando excluído' });
    },
  });

  // Toggle mutation
  const toggleGlobalMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('whatsapp_commands_global')
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-commands-global'] }),
  });

  const isLoading = loadingAdmin || loadingCommands;

  // Proteção: apenas admins da plataforma
  if (loadingAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center text-muted-foreground">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Acesso restrito</p>
            <p className="text-sm mt-2">
              Apenas administradores da plataforma podem gerenciar comandos.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/app/settings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Configurações
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/app/settings">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Comandos WhatsApp</h1>
              <p className="text-muted-foreground">
                Configure os comandos globais disponíveis para interação via WhatsApp
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Comando
          </Button>
        </div>

        {/* Commands Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Comandos Globais
            </CardTitle>
            <CardDescription>
              Disponíveis para todas as empresas da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <CommandsList
                commands={globalCommands}
                onEdit={setEditingCommand}
                onDelete={(id) => deleteGlobalMutation.mutate(id)}
                onToggle={(id, active) => toggleGlobalMutation.mutate({ id, active })}
                isDeleting={deleteGlobalMutation.isPending}
              />
            )}
          </CardContent>
        </Card>

        {/* Editor Dialog */}
        <Dialog 
          open={!!editingCommand || isCreating} 
          onOpenChange={(open) => {
            if (!open) {
              setEditingCommand(null);
              setIsCreating(false);
            }
          }}
        >
          <CommandEditor
            command={editingCommand}
            onSave={(data) => saveGlobalMutation.mutate(data)}
            onClose={() => {
              setEditingCommand(null);
              setIsCreating(false);
            }}
            isSaving={saveGlobalMutation.isPending}
          />
        </Dialog>
      </div>
    </AppLayout>
  );
}
