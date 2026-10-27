import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { FileText, Settings, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ColumnMapping } from './ColumnMapper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ImportProfile {
  id: string;
  name: string;
  mapping: ColumnMapping;
  is_default: boolean;
  created_at: string;
}

interface ProfileSelectorProps {
  selectedProfileId: string | null;
  onProfileSelect: (profile: ImportProfile | null) => void;
  onManualMapping: () => void;
}

export function ProfileSelector({ selectedProfileId, onProfileSelect, onManualMapping }: ProfileSelectorProps) {
  const { tenant } = useTenant();
  const [profiles, setProfiles] = useState<ImportProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadProfiles();
    }
  }, [tenant]);

  const loadProfiles = async () => {
    if (!tenant) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('import_profiles')
        .select('id, name, mapping, is_default, created_at')
        .eq('tenant_id', tenant.id)
        .eq('kind', 'sales')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      // Cast mapping to ColumnMapping type
      const typedProfiles = (data || []).map(p => ({
        ...p,
        mapping: p.mapping as unknown as ColumnMapping,
      }));

      setProfiles(typedProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProfileId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('import_profiles')
        .delete()
        .eq('id', deleteProfileId);

      if (error) throw error;

      toast({ title: 'Perfil excluído' });
      setProfiles(profiles.filter(p => p.id !== deleteProfileId));
      
      if (selectedProfileId === deleteProfileId) {
        onProfileSelect(null);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o perfil.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteProfileId(null);
    }
  };

  const handleSelectChange = (value: string) => {
    if (value === 'auto') {
      onProfileSelect(null);
    } else if (value === 'manual') {
      onManualMapping();
    } else {
      const profile = profiles.find(p => p.id === value);
      if (profile) {
        onProfileSelect(profile);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando perfis...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Perfil de Importação</label>
      <div className="flex gap-2">
        <Select
          value={selectedProfileId || 'auto'}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um perfil" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="auto">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Detecção Automática
              </span>
            </SelectItem>
            <SelectItem value="manual">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Mapeamento Manual...
              </span>
            </SelectItem>
            {profiles.length > 0 && (
              <div className="border-t my-1" />
            )}
            {profiles.map(profile => (
              <SelectItem key={profile.id} value={profile.id}>
                <span className="flex items-center gap-2">
                  {profile.name}
                  {profile.is_default && (
                    <Badge variant="secondary" className="text-xs">Padrão</Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedProfileId && profiles.find(p => p.id === selectedProfileId) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteProfileId(selectedProfileId)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {profiles.length === 0
          ? 'Nenhum perfil salvo. Use "Mapeamento Manual" para criar um.'
          : `${profiles.length} perfil(is) salvo(s)`}
      </p>

      <AlertDialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O perfil será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
