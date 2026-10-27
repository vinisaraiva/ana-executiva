/**
 * @fileoverview Página de Importações - DrGeFin
 * 
 * Página para gerenciamento de importações de arquivos de vendas.
 * Permite:
 * - Listar todas as importações do tenant
 * - Filtrar por status e buscar por nome
 * - Visualizar importações ativas e arquivadas
 * - Arquivar, restaurar e excluir permanentemente
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { useTenant } from '@/hooks/useTenant';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, FileSpreadsheet, Eye, Loader2, Trash2, Archive, ArchiveRestore, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { DeleteImportDialog } from '@/components/imports/DeleteImportDialog';
import { PermanentDeleteDialog } from '@/components/imports/PermanentDeleteDialog';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de gerenciamento de importações.
 * 
 * Exibe lista de importações com filtros, busca e ações de gerenciamento.
 * Suporta visualização de importações ativas e arquivadas.
 */
export default function Imports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  
  // Estados de filtro e busca
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  
  // Estados para diálogos de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [importToDelete, setImportToDelete] = useState<{ id: string; filename: string } | null>(null);

  // Query para buscar importações do tenant
  const { data: importRuns, isLoading } = useQuery({
    queryKey: ['import-runs', tenant?.id, search, statusFilter, showArchived],
    queryFn: async () => {
      if (!tenant) return [];
      
      // Monta query base com filtros
      let query = supabase
        .from('import_runs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', !showArchived)
        .order('created_at', { ascending: false });

      // Aplica filtro de status se não for "all"
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'queued' | 'processing' | 'done' | 'failed' | 'canceled');
      }

      const { data } = await query;
      
      // Aplica filtro de busca por nome do arquivo (client-side)
      if (search && data) {
        return data.filter(run => 
          run.original_filename?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      return data || [];
    },
    enabled: !!tenant,
  });

  // Mutation para arquivar uma importação (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (importId: string) => {
      const { error } = await supabase
        .from('import_runs')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', importId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-runs'] });
      toast({
        title: 'Importação excluída',
        description: 'A importação foi movida para o arquivo.',
      });
      setDeleteDialogOpen(false);
      setImportToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Mutation para restaurar uma importação arquivada
  const restoreMutation = useMutation({
    mutationFn: async (importId: string) => {
      const { error } = await supabase
        .from('import_runs')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', importId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-runs'] });
      toast({
        title: 'Importação restaurada',
        description: 'A importação foi restaurada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao restaurar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Mutation para exclusão permanente (hard delete)
  // Remove todos os dados relacionados: anomalias, fatos, vendas, arquivo e registro
  const permanentDeleteMutation = useMutation({
    mutationFn: async (importId: string) => {
      // 1. Buscar file_path antes de deletar (para remover do storage)
      const { data: importRun } = await supabase
        .from('import_runs')
        .select('file_path')
        .eq('id', importId)
        .maybeSingle();

      // 2. Deletar anomalias relacionadas
      const { error: anomaliesError } = await supabase
        .from('anomalies')
        .delete()
        .eq('import_run_id', importId);
      if (anomaliesError) throw anomaliesError;

      // 3. Deletar run_facts relacionados
      const { error: factsError } = await supabase
        .from('run_facts')
        .delete()
        .eq('import_run_id', importId);
      if (factsError) throw factsError;

      // 4. Deletar sales_lines relacionadas
      const { error: salesError } = await supabase
        .from('sales_lines')
        .delete()
        .eq('import_run_id', importId);
      if (salesError) throw salesError;

      // 5. Deletar arquivo do Storage (se existir)
      if (importRun?.file_path) {
        await supabase.storage.from('imports').remove([importRun.file_path]);
      }

      // 6. Deletar import_run
      const { error: runError } = await supabase
        .from('import_runs')
        .delete()
        .eq('id', importId);
      if (runError) throw runError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-runs'] });
      toast({
        title: 'Importação excluída permanentemente',
        description: 'Todos os dados foram removidos.',
      });
      setPermanentDeleteDialogOpen(false);
      setImportToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  /**
   * Abre o diálogo de confirmação para arquivar importação.
   */
  const handleDeleteClick = (id: string, filename: string) => {
    setImportToDelete({ id, filename: filename || 'Arquivo sem nome' });
    setDeleteDialogOpen(true);
  };

  /**
   * Abre o diálogo de confirmação para exclusão permanente.
   */
  const handlePermanentDeleteClick = (id: string, filename: string) => {
    setImportToDelete({ id, filename: filename || 'Arquivo sem nome' });
    setPermanentDeleteDialogOpen(true);
  };

  /**
   * Confirma o arquivamento da importação.
   */
  const handleConfirmDelete = () => {
    if (importToDelete) {
      deleteMutation.mutate(importToDelete.id);
    }
  };

  /**
   * Confirma a exclusão permanente da importação.
   */
  const handleConfirmPermanentDelete = () => {
    if (importToDelete) {
      permanentDeleteMutation.mutate(importToDelete.id);
    }
  };

  /**
   * Restaura uma importação arquivada.
   */
  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  // Configuração de labels e cores para cada status
  const statusConfig: Record<string, { label: string; className: string }> = {
    queued: { label: 'Na fila', className: 'bg-muted text-muted-foreground' },
    processing: { label: 'Processando', className: 'bg-primary/10 text-primary' },
    done: { label: 'Concluído', className: 'bg-success/10 text-success' },
    failed: { label: 'Erro', className: 'bg-destructive/10 text-destructive' },
    canceled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  };

  return (
    <AppLayout title={showArchived ? 'Importações Arquivadas' : 'Importações'}>
      <div className="space-y-6 animate-fade-in">
        {/* Barra de ações: busca, filtros e botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4 flex-1">
            {/* Campo de busca por nome do arquivo */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do arquivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Filtro por status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="queued">Na fila</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="done">Concluído</SelectItem>
                <SelectItem value="failed">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {/* Botão para alternar entre ativas e arquivadas */}
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              {showArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Ver Ativas
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Ver Arquivadas
                </>
              )}
            </Button>
            {/* Botão de nova importação - só aparece na view de ativas */}
            {!showArchived && (
              <Button onClick={() => navigate('/app/imports/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Importação
              </Button>
            )}
          </div>
        </div>

        {/* Tabela de importações */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              // Estado de carregamento
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : importRuns && importRuns.length > 0 ? (
              // Tabela com dados
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRuns.map((run) => {
                    const config = statusConfig[run.status] || statusConfig.queued;
                    return (
                      <TableRow key={run.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileSpreadsheet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium truncate max-w-[250px]">
                                {run.original_filename || 'Arquivo sem nome'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {run.granularity || 'Granularidade não detectada'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${config.className}`}>
                            {config.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {run.detected_start_date && run.detected_end_date ? (
                            <span className="text-sm">
                              {new Date(run.detected_start_date).toLocaleDateString('pt-BR')} -{' '}
                              {new Date(run.detected_end_date).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(run.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Botão de visualizar detalhes */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/app/imports/${run.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {showArchived ? (
                              // Ações para importações arquivadas
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRestore(run.id)}
                                  disabled={restoreMutation.isPending}
                                  title="Restaurar"
                                >
                                  <ArchiveRestore className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePermanentDeleteClick(run.id, run.original_filename || '')}
                                  disabled={permanentDeleteMutation.isPending}
                                  title="Excluir permanentemente"
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            ) : (
                              // Ação para importações ativas
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(run.id, run.original_filename || '')}
                                title="Arquivar"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              // Estado vazio
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">
                  {showArchived ? 'Nenhuma importação arquivada' : 'Nenhuma importação encontrada'}
                </p>
                <p className="text-sm">
                  {showArchived 
                    ? 'Importações excluídas aparecerão aqui' 
                    : 'Faça sua primeira importação para começar'}
                </p>
                {!showArchived && (
                  <Button className="mt-4 gap-2" onClick={() => navigate('/app/imports/new')}>
                    <Plus className="h-4 w-4" />
                    Nova Importação
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de confirmação para arquivar */}
      <DeleteImportDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        filename={importToDelete?.filename || ''}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* Diálogo de confirmação para exclusão permanente */}
      <PermanentDeleteDialog
        open={permanentDeleteDialogOpen}
        onOpenChange={setPermanentDeleteDialogOpen}
        filename={importToDelete?.filename || ''}
        onConfirm={handleConfirmPermanentDelete}
        isDeleting={permanentDeleteMutation.isPending}
      />
    </AppLayout>
  );
}
