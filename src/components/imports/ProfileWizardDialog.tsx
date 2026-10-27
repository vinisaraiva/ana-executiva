import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilePreview } from './FilePreview';
import { ColumnMapper, ColumnMapping, DEFAULT_MAPPING, SYSTEM_FIELDS } from './ColumnMapper';
import { MappedDataPreview } from './MappedDataPreview';
import { Loader2, Save, Upload, Wand2, Eye, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { toast } from '@/hooks/use-toast';

interface ProfileWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  previewRows: string[][];
  onConfirm: (mapping: ColumnMapping, profileId?: string) => void;
  autoMapping?: ColumnMapping;
  totalRows?: number;
}

export function ProfileWizardDialog({
  open,
  onOpenChange,
  headers,
  previewRows,
  onConfirm,
  autoMapping,
  totalRows,
}: ProfileWizardDialogProps) {
  const { tenant } = useTenant();
  const [mapping, setMapping] = useState<ColumnMapping>(autoMapping || DEFAULT_MAPPING);
  const [saveAsProfile, setSaveAsProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setMapping(autoMapping || DEFAULT_MAPPING);
      setSaveAsProfile(false);
      setProfileName('');
      setActiveTab('preview');
    }
  }, [open, autoMapping]);

  const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
  const isValid = requiredFields.every(f => mapping[f.key as keyof ColumnMapping] !== -1);

  const handleConfirm = async () => {
    if (!isValid) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Mapeie ao menos Data e Valor para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    let profileId: string | undefined;

    try {
      if (saveAsProfile && profileName.trim() && tenant) {
        // Save as import profile - cast mapping to Json type
        const mappingJson = JSON.parse(JSON.stringify(mapping));
        
        const { data: profile, error } = await supabase
          .from('import_profiles')
          .insert([{
            tenant_id: tenant.id,
            name: profileName.trim(),
            mapping: mappingJson,
            is_default: false,
            kind: 'sales',
          }])
          .select('id')
          .single();

        if (error) {
          throw new Error('Falha ao salvar perfil: ' + error.message);
        }

        profileId = profile.id;
        toast({
          title: 'Perfil salvo!',
          description: `O perfil "${profileName}" foi salvo e poderá ser reutilizado.`,
        });
      }

      onConfirm(mapping, profileId);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoDetect = () => {
    if (autoMapping) {
      setMapping(autoMapping);
      toast({
        title: 'Mapeamento automático aplicado',
        description: 'Revise as colunas detectadas.',
      });
    }
  };

  const actualTotalRows = totalRows ?? previewRows.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Configurar Mapeamento de Colunas
          </DialogTitle>
          <DialogDescription>
            Identifique quais colunas do seu arquivo correspondem aos campos do sistema.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">1. Preview</TabsTrigger>
            <TabsTrigger value="mapping">2. Mapear</TabsTrigger>
            <TabsTrigger value="validate" disabled={!isValid}>
              3. Validar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Confira as primeiras linhas do seu arquivo para identificar as colunas:
              </p>
              <FilePreview headers={headers} rows={previewRows} maxRows={5} />
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('mapping')}>
                  Próximo: Mapear Colunas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="flex-1 overflow-auto mt-4">
            <div className="space-y-6">
              {autoMapping && (
                <Button variant="outline" size="sm" onClick={handleAutoDetect}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Usar Detecção Automática
                </Button>
              )}

              <ColumnMapper
                headers={headers}
                mapping={mapping}
                onMappingChange={setMapping}
              />

              {/* Save as profile option */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-profile"
                    checked={saveAsProfile}
                    onCheckedChange={(checked) => setSaveAsProfile(!!checked)}
                  />
                  <Label htmlFor="save-profile" className="text-sm cursor-pointer">
                    Salvar como perfil reutilizável
                  </Label>
                </div>

                {saveAsProfile && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="profile-name" className="text-xs text-muted-foreground">
                      Nome do perfil
                    </Label>
                    <Input
                      id="profile-name"
                      placeholder="Ex: Planilha Shopify, Relatório SAP..."
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('validate')} disabled={!isValid}>
                  Próximo: Validar Dados
                  <Eye className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validate" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <MappedDataPreview
                mapping={mapping}
                headers={headers}
                rows={previewRows}
                totalRows={actualTotalRows}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isValid || saving || activeTab !== 'validate'}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : saveAsProfile ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar e Continuar
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Continuar Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
