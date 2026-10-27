/**
 * @fileoverview Página de Configurações - DrGeFin
 * 
 * Central de configurações do usuário e empresa, organizada em abas:
 * 
 * - **Meu Plano**: Visualização do plano atual, uso e limites
 * - **Empresa**: Configurações do perfil da empresa e do usuário
 * - **Chat IA**: Personalização do assistente de IA
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MessageSquare, Crown, MessageCircle } from 'lucide-react';
import { ChatSettingsForm } from '@/components/settings/ChatSettingsForm';
import { CompanyProfileForm } from '@/components/settings/CompanyProfileForm';
import { UserProfileForm } from '@/components/settings/UserProfileForm';
import { PlanUsageCard } from '@/components/settings/PlanUsageCard';
import { WhatsAppSettingsForm } from '@/components/settings/WhatsAppSettingsForm';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de configurações do DrGeFin.
 * 
 * Organiza as configurações em abas para facilitar navegação:
 * - Meu Plano: Uso do plano atual e informações de assinatura
 * - Empresa: Dados da empresa e perfil do usuário
 * - Chat IA: Personalização do assistente (nome, tom, instruções)
 */
export default function Settings() {

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações da sua empresa</p>
        </div>

        {/* Sistema de abas para organizar configurações */}
        <Tabs defaultValue="plan" className="space-y-6">
          {/* Lista de abas */}
          <TabsList>
            {/* Aba: Meu Plano */}
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Meu Plano
            </TabsTrigger>
            {/* Aba: Empresa */}
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            {/* Aba: Chat IA */}
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat IA
            </TabsTrigger>
            {/* Aba: WhatsApp */}
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo: Aba Meu Plano */}
          <TabsContent value="plan">
            <div className="max-w-2xl">
              {/* Card com informações do plano, uso e limites */}
              <PlanUsageCard />
            </div>
          </TabsContent>

          {/* Conteúdo: Aba Empresa */}
          <TabsContent value="company">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Formulário de dados da empresa */}
              <CompanyProfileForm />
              {/* Formulário de dados do usuário */}
              <UserProfileForm />
            </div>
          </TabsContent>

          {/* Conteúdo: Aba Chat IA */}
          <TabsContent value="chat">
            {/* Formulário de personalização do chat */}
            <ChatSettingsForm />
          </TabsContent>

          {/* Conteúdo: Aba WhatsApp */}
          <TabsContent value="whatsapp">
            {/* Gerenciamento de números WhatsApp */}
            <WhatsAppSettingsForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
