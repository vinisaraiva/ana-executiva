/**
 * @fileoverview Formulário de Perfil da Empresa - DrGeFin
 * 
 * Componente para editar os dados da empresa (tenant),
 * incluindo nome, setor de atuação e exibição da data
 * de criação.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Briefcase, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Schema de validação do formulário da empresa.
 */
const companySchema = z.object({
  name: z.string().trim().min(1, 'Nome da empresa é obrigatório').max(100, 'Máximo de 100 caracteres'),
  sector: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export function CompanyProfileForm() {
  const { tenant, refetch } = useTenant();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      sector: '',
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name || '',
        sector: tenant.sector || '',
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: CompanyFormData) => {
    if (!tenant?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: data.name,
          sector: data.sector || null,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      await refetch();
      toast({
        title: 'Dados atualizados',
        description: 'As informações da empresa foram salvas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar os dados da empresa.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Dados da Empresa
        </CardTitle>
        <CardDescription>Informações gerais da empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    Setor
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um setor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.name}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1 pt-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Data de Criação
              </p>
              <p className="text-sm text-foreground">
                {tenant?.created_at
                  ? format(new Date(tenant.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Não definido'}
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
