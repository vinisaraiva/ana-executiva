import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Building2, MessageCircle } from 'lucide-react';
import { z } from 'zod';

// Regex para validar telefone brasileiro (com ou sem máscara)
const phoneRegex = /^(\d{10,11}|\(\d{2}\)\s?\d{4,5}-?\d{4})$/;

const tenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  sector: z.string().min(1, 'Selecione o setor da empresa'),
  whatsapp: z.string().optional().refine(
    (val) => !val || phoneRegex.test(val.replace(/\D/g, '')),
    'Telefone inválido'
  ),
});

/**
 * Formata número de telefone brasileiro
 */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Remove formatação e adiciona código do país
 */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  // Adiciona código do Brasil se não tiver
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function CreateTenantForm() {
  const { createTenant } = useTenant();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Fetch sectors from database
  const { data: sectors, isLoading: sectorsLoading } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const userName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : '';

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = tenantSchema.safeParse({ name, sector, whatsapp });
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const normalizedPhone = normalizePhone(whatsapp);
      const { error } = await createTenant(name, sector, normalizedPhone || undefined, userName || undefined);
      if (error) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Empresa criada!',
          description: 'Sua empresa foi criada com sucesso.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 shadow-lg animate-fade-in">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Bem-vindo ao DrGeFin!</CardTitle>
        <CardDescription>
          Para começar, crie sua primeira empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da empresa</Label>
            <Input
              id="company-name"
              placeholder="Ex: Minha Empresa Ltda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Setor da empresa</Label>
            <Select value={sector} onValueChange={setSector} required disabled={sectorsLoading}>
              <SelectTrigger id="sector">
                <SelectValue placeholder={sectorsLoading ? "Carregando..." : "Selecione o setor"} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {sectors?.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              WhatsApp (opcional)
            </Label>
            <Input
              id="whatsapp"
              placeholder="(71) 98756-6920"
              value={whatsapp}
              onChange={handlePhoneChange}
              maxLength={16}
            />
            <p className="text-xs text-muted-foreground">
              Cadastre para receber relatórios pelo WhatsApp
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !sector}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar empresa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
