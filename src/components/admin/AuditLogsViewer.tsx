/**
 * @fileoverview Visualizador de Logs de Auditoria - DrGeFin
 * 
 * Painel administrativo para visualizar logs de auditoria
 * da plataforma, incluindo logins, uploads, alterações de
 * permissões e outras ações críticas de segurança.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  Search, 
  Download, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estrutura de um log de auditoria.
 */
interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  severity: string;
  user_id: string | null;
  user_email: string | null;
  tenant_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
  success: boolean;
  error_message: string | null;
  tenant?: {
    name: string;
  };
}

const ACTIONS_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  login_success: { label: 'Login bem-sucedido', icon: <User className="h-3 w-3" /> },
  login_failed: { label: 'Login falhou', icon: <AlertTriangle className="h-3 w-3" /> },
  logout: { label: 'Logout', icon: <User className="h-3 w-3" /> },
  signup: { label: 'Cadastro', icon: <User className="h-3 w-3" /> },
  access_denied: { label: 'Acesso negado', icon: <Shield className="h-3 w-3" /> },
  file_upload: { label: 'Upload de arquivo', icon: <Info className="h-3 w-3" /> },
  file_delete: { label: 'Exclusão de arquivo', icon: <AlertTriangle className="h-3 w-3" /> },
  chat_request: { label: 'Requisição de chat', icon: <Info className="h-3 w-3" /> },
  tenant_created: { label: 'Empresa criada', icon: <Info className="h-3 w-3" /> },
  tenant_updated: { label: 'Empresa atualizada', icon: <Info className="h-3 w-3" /> },
  membership_changed: { label: 'Permissão alterada', icon: <AlertTriangle className="h-3 w-3" /> },
  import_created: { label: 'Import criado', icon: <Info className="h-3 w-3" /> },
  import_deleted: { label: 'Import excluído', icon: <AlertTriangle className="h-3 w-3" /> },
  settings_updated: { label: 'Config. atualizada', icon: <Info className="h-3 w-3" /> },
};

const PAGE_SIZE = 50;

export function AuditLogsViewer() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs', page, severityFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          tenant:tenants(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter as any);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data as AuditLog[], count: count || 0 };
    },
  });

  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    if (!searchTerm) return data.logs;
    
    const lower = searchTerm.toLowerCase();
    return data.logs.filter(log => 
      log.user_email?.toLowerCase().includes(lower) ||
      log.tenant?.name?.toLowerCase().includes(lower) ||
      log.action?.toLowerCase().includes(lower) ||
      log.error_message?.toLowerCase().includes(lower) ||
      JSON.stringify(log.details).toLowerCase().includes(lower)
    );
  }, [data?.logs, searchTerm]);

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Aviso</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getSuccessBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500/20 text-green-700 border-green-500/30">OK</Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Falha</Badge>
    );
  };

  const handleExportCSV = () => {
    if (!data?.logs) return;
    
    const headers = ['Data', 'Ação', 'Severidade', 'Usuário', 'Empresa', 'Sucesso', 'Erro', 'Detalhes'];
    const rows = data.logs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      log.action,
      log.severity,
      log.user_email || 'Anônimo',
      log.tenant?.name || '-',
      log.success ? 'Sim' : 'Não',
      log.error_message || '',
      JSON.stringify(log.details)
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Logs de Auditoria
            </CardTitle>
            <CardDescription>
              Registro de todas as ações críticas na plataforma
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!data?.logs?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, empresa, ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="access_denied">Acesso negado</SelectItem>
              <SelectItem value="login_success">Login sucesso</SelectItem>
              <SelectItem value="login_failed">Login falhou</SelectItem>
              <SelectItem value="file_upload">Upload</SelectItem>
              <SelectItem value="chat_request">Chat</SelectItem>
              <SelectItem value="tenant_created">Empresa criada</SelectItem>
              <SelectItem value="settings_updated">Config. atualizada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Summary */}
        {data && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data.count.toLocaleString('pt-BR')} registros
            </span>
            {data.logs.filter(l => l.severity === 'critical').length > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {data.logs.filter(l => l.severity === 'critical').length} críticos nesta página
              </span>
            )}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Data/Hora</TableHead>
                  <TableHead className="w-[150px]">Ação</TableHead>
                  <TableHead className="w-[80px]">Severidade</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[70px]">Status</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className={log.severity === 'critical' ? 'bg-red-500/5' : undefined}
                    >
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {ACTIONS_MAP[log.action]?.icon}
                          <span className="text-sm">{ACTIONS_MAP[log.action]?.label || log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {log.user_email || <span className="text-muted-foreground italic">Anônimo</span>}
                      </TableCell>
                      <TableCell>
                        {log.tenant?.name ? (
                          <Link 
                            to={`/admin/tenant/${log.tenant_id}`}
                            className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                          >
                            {log.tenant.name}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getSuccessBadge(log.success)}</TableCell>
                      <TableCell className="max-w-[250px]">
                        {log.error_message ? (
                          <span className="text-xs text-red-600 truncate block">
                            {log.error_message}
                          </span>
                        ) : log.details && Object.keys(log.details).length > 0 ? (
                          <span className="text-xs text-muted-foreground truncate block">
                            {JSON.stringify(log.details).slice(0, 50)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
