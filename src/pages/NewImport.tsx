/**
 * @fileoverview Página de Nova Importação - DrGeFin
 * 
 * Wizard de importação de arquivos de vendas que permite:
 * - Selecionar ou criar perfis de mapeamento de colunas
 * - Fazer upload de arquivos XLSX/CSV
 * - Configurar mapeamento manual de colunas
 * - Detectar e resolver sobreposição de períodos
 * - Enviar arquivo para processamento
 * 
 * O arquivo é enviado para uma Edge Function que:
 * 1. Salva no Storage
 * 2. Cria registro de import_run
 * 3. Enfileira job de processamento
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OverlapDialog, type ExistingImport } from '@/components/imports/OverlapDialog';
import { ProfileSelector } from '@/components/imports/ProfileSelector';
import { ProfileWizardDialog } from '@/components/imports/ProfileWizardDialog';
import { parseFile, autoDetectMapping, detectDateRange, ParsedFile } from '@/lib/parseFile';
import { ColumnMapping, DEFAULT_MAPPING } from '@/components/imports/ColumnMapper';
import { UsageMeter } from '@/components/UsageMeter';

// ============================================================================
// CONSTANTES
// ============================================================================

/** Tipos MIME aceitos para upload */
const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
];

/** Tamanho máximo do arquivo: 5MB (para evitar timeouts) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Timeout para upload: 90 segundos */
const UPLOAD_TIMEOUT = 90000;

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Perfil de mapeamento de colunas selecionado.
 */
interface SelectedProfile {
  id: string;
  name: string;
  mapping: ColumnMapping;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de nova importação.
 * 
 * Permite ao usuário fazer upload de arquivo de vendas,
 * configurar mapeamento de colunas e enviar para processamento.
 */
export default function NewImport() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { session } = useAuth();
  
  // Estados do arquivo
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Estados de sobreposição de período
  const [showOverlapDialog, setShowOverlapDialog] = useState(false);
  const [existingImports, setExistingImports] = useState<ExistingImport[]>([]);
  const [newPeriod, setNewPeriod] = useState<{ start: string; end: string } | null>(null);
  const [overallRecommendation, setOverallRecommendation] = useState<'replace' | 'merge' | 'skip' | null>(null);
  
  // Estados do wizard de perfil/mapeamento
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [autoMapping, setAutoMapping] = useState<ColumnMapping | null>(null);
  const [manualMapping, setManualMapping] = useState<ColumnMapping | null>(null);

  /**
   * Valida arquivo antes de aceitar.
   * @returns Mensagem de erro ou null se válido
   */
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use XLSX ou CSV.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo de 5MB para garantir processamento estável.';
    }
    return null;
  };

  /**
   * Handler para quando arquivo é solto na zona de drop.
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const error = validateFile(droppedFile);
      if (error) {
        toast({ title: 'Erro', description: error, variant: 'destructive' });
        return;
      }
      setFile(droppedFile);
      // Reseta mapeamentos quando novo arquivo é selecionado
      setManualMapping(null);
      setParsedFile(null);
    }
  }, []);

  /**
   * Handler para seleção de arquivo via input.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        toast({ title: 'Erro', description: error, variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
      // Reseta mapeamentos quando novo arquivo é selecionado
      setManualMapping(null);
      setParsedFile(null);
    }
  };

  /**
   * Handler para seleção de perfil de importação.
   */
  const handleProfileSelect = (profile: SelectedProfile | null) => {
    setSelectedProfile(profile);
  };

  /**
   * Abre o wizard de mapeamento manual.
   * Faz parse do arquivo para detectar colunas disponíveis.
   */
  const handleManualMapping = async () => {
    if (!file) {
      toast({ title: 'Selecione um arquivo primeiro', variant: 'destructive' });
      return;
    }

    try {
      const parsed = await parseFile(file);
      setParsedFile(parsed);
      
      // Auto-detecta mapeamento como sugestão inicial
      const detected = autoDetectMapping(parsed.headers) as unknown as ColumnMapping;
      setAutoMapping(detected);
      
      setShowWizard(true);
    } catch (error) {
      toast({
        title: 'Erro ao ler arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  /**
   * Callback quando wizard confirma mapeamento.
   */
  const handleWizardConfirm = (mapping: ColumnMapping, profileId?: string) => {
    setManualMapping(mapping);
    setShowWizard(false);
    
    if (profileId) {
      // Perfil foi salvo, limpa seleção para usar mapeamento manual
      setSelectedProfile(null);
    }
    
    toast({
      title: 'Mapeamento configurado',
      description: 'O arquivo será processado com suas configurações.',
    });
  };

  /**
   * Dispara o worker de processamento de jobs.
   * Chamado após upload bem-sucedido para iniciar processamento.
   */
  const triggerWorker = async () => {
    try {
      const response = await fetch(
        `https://uhixhpdpmdehmeolwfen.supabase.co/functions/v1/process-job`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      console.log('Worker triggered:', result);
    } catch (error) {
      console.error('Failed to trigger worker:', error);
    }
  };

  /**
   * Faz upload do arquivo para a Edge Function.
   * 
   * @param overlapAction - Ação para sobreposição: check, replace ou merge
   * @param importsToDeactivate - IDs de imports a desativar (para replace)
   */
  const uploadFile = async (overlapAction: 'check' | 'replace' | 'merge', importsToDeactivate?: string[]) => {
    if (!file || !tenant || !session) return;

    setUploading(true);

    // Configura timeout para abortar requisição lenta
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);

    try {
      // Monta FormData com arquivo e metadados
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', tenant.id);
      formData.append('overlap_action', overlapAction);
      
      // Inclui IDs de imports a desativar (quando substituindo)
      if (importsToDeactivate) {
        formData.append('imports_to_deactivate', JSON.stringify(importsToDeactivate));
      }

      // Inclui mapeamento se perfil ou mapeamento manual está definido
      const mappingToUse = manualMapping || selectedProfile?.mapping;
      if (mappingToUse) {
        formData.append('column_mapping', JSON.stringify(mappingToUse));
      }

      // Inclui ID do perfil se selecionado
      if (selectedProfile) {
        formData.append('profile_id', selectedProfile.id);
      }

      // Quando verificando sobreposição, tenta detectar e enviar período do arquivo
      if (overlapAction === 'check') {
        try {
          const parsed = parsedFile || await parseFile(file);
          const detected = autoDetectMapping(parsed.headers);
          const dateColIndex = detected.date;
          
          if (dateColIndex >= 0) {
            const dateRange = detectDateRange(parsed, dateColIndex);
            if (dateRange.startDate && dateRange.endDate) {
              formData.append('new_start_date', dateRange.startDate);
              formData.append('new_end_date', dateRange.endDate);
            }
          }
        } catch (err) {
          console.warn('Could not detect date range:', err);
        }
      }

      // Envia para Edge Function
      const response = await fetch(
        `https://uhixhpdpmdehmeolwfen.supabase.co/functions/v1/upload-file`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const result = await response.json();

      // Trata erros HTTP
      if (!response.ok) {
        const errorData = result;
        if (response.status === 402) {
          throw new Error(errorData.error || 'Limite de importações atingido. Faça upgrade para continuar.');
        }
        if (response.status === 403) {
          throw new Error(errorData.error || 'Acesso negado.');
        }
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      // Se retornou verificação de sobreposição, mostra diálogo
      if (result.overlap_check && result.existing_imports) {
        setExistingImports(result.existing_imports);
        setNewPeriod(result.new_period || null);
        setOverallRecommendation(result.overall_recommendation || null);
        setShowOverlapDialog(true);
        setUploading(false);
        return;
      }

      // Sucesso - dispara worker e navega para detalhes
      triggerWorker();

      toast({
        title: 'Upload realizado!',
        description: 'Seu arquivo foi enviado e está sendo processado.',
      });

      navigate(`/app/imports/${result.import_run_id}`);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Upload error:', error);
      
      // Trata timeout especificamente
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: 'Tempo limite excedido',
          description: 'O upload demorou muito. Verifique a página de importações para ver se o arquivo foi processado.',
          variant: 'destructive',
        });
        navigate('/app/imports');
      } else {
        toast({
          title: 'Erro no upload',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
      setUploading(false);
    }
  };

  /**
   * Inicia upload com verificação de sobreposição.
   */
  const handleUpload = () => {
    uploadFile('check');
  };

  /**
   * Confirma substituição de imports existentes.
   */
  const handleReplace = () => {
    setShowOverlapDialog(false);
    const idsToDeactivate = existingImports.map(imp => imp.id);
    uploadFile('replace', idsToDeactivate);
  };

  /**
   * Confirma merge com imports existentes.
   */
  const handleMerge = () => {
    setShowOverlapDialog(false);
    uploadFile('merge');
  };

  /**
   * Cancela operação de sobreposição.
   */
  const handleCancelOverlap = () => {
    setShowOverlapDialog(false);
    setUploading(false);
  };

  // Indica se há mapeamento configurado (manual ou via perfil)
  const hasMapping = manualMapping || selectedProfile?.mapping;

  return (
    <AppLayout title="Nova Importação">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Enviar arquivo de vendas</CardTitle>
            <CardDescription>
              Faça upload de um arquivo XLSX ou CSV com seus dados de vendas para análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Medidor de uso - mostra quantas importações ainda podem ser feitas */}
            {tenant && (
              <UsageMeter tenantId={tenant.id} type="imports" />
            )}

            {/* Seletor de perfil de mapeamento */}
            <ProfileSelector
              selectedProfileId={selectedProfile?.id || null}
              onProfileSelect={handleProfileSelect}
              onManualMapping={handleManualMapping}
            />

            {/* Indicador de mapeamento manual configurado */}
            {manualMapping && (
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-success">Mapeamento manual configurado</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualMapping(null)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </Button>
              </div>
            )}

            {/* Zona de drop para arquivo */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                file && 'border-success bg-success/5'
              )}
            >
              {file ? (
                // Arquivo selecionado
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="h-16 w-16 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setManualMapping(null);
                      setParsedFile(null);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                // Aguardando arquivo
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Arraste e solte seu arquivo aqui
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou clique para selecionar
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Selecionar arquivo
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: XLSX, CSV • Máximo: 5MB
                  </p>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => navigate('/app/imports')}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="gap-2"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? 'Enviando...' : 'Enviar e Processar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de sobreposição de período */}
      <OverlapDialog
        open={showOverlapDialog}
        onOpenChange={setShowOverlapDialog}
        existingImports={existingImports}
        newPeriod={newPeriod}
        overallRecommendation={overallRecommendation}
        onReplace={handleReplace}
        onMerge={handleMerge}
        onCancel={handleCancelOverlap}
      />

      {/* Wizard de mapeamento de colunas */}
      {parsedFile && (
        <ProfileWizardDialog
          open={showWizard}
          onOpenChange={setShowWizard}
          headers={parsedFile.headers}
          previewRows={parsedFile.rows}
          onConfirm={handleWizardConfirm}
          autoMapping={autoMapping || undefined}
          totalRows={parsedFile.totalRows}
        />
      )}
    </AppLayout>
  );
}
