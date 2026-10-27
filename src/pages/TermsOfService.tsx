/**
 * @fileoverview Termos de Uso - DrGeFin
 * 
 * Página legal com os termos de uso do serviço DrGeFin.
 * 
 * Conteúdo inclui:
 * - Aceitação dos termos
 * - Descrição do serviço
 * - Requisitos de cadastro e conta
 * - Planos e pagamentos
 * - Uso aceitável
 * - Propriedade de dados
 * - Propriedade intelectual
 * - Limitação de responsabilidade
 * - Rescisão
 * - Disposições gerais
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Página de Termos de Uso.
 * 
 * Documento legal que estabelece as regras e condições
 * para uso da plataforma DrGeFin.
 */
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Cabeçalho da página */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Termos de Uso</h1>
            <p className="text-muted-foreground">Última atualização: 28 de dezembro de 2024</p>
          </div>

          <div className="space-y-8">
            {/* Seção 1: Aceitação */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar ou utilizar a plataforma DrGeFin ("Serviço"), você concorda em cumprir 
                e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte 
                destes termos, não poderá acessar ou usar o Serviço. Estes termos constituem um 
                contrato legal entre você e a DrGeFin.
              </p>
            </section>

            {/* Seção 2: Descrição do Serviço */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O DrGeFin é uma plataforma de análise financeira que utiliza inteligência artificial 
                para ajudar empresas a entender seus dados de vendas. O Serviço inclui:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Importação e processamento de dados de vendas</li>
                <li>Análise automatizada com identificação de tendências e anomalias</li>
                <li>Assistente de IA para consultas sobre seus dados</li>
                <li>Dashboards e relatórios personalizados</li>
                <li>Insights e recomendações para melhorar resultados</li>
              </ul>
            </section>

            {/* Seção 3: Cadastro e Conta */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Cadastro e Conta</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-2">3.1. Requisitos</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para usar o Serviço, você deve ter pelo menos 18 anos e capacidade legal para 
                celebrar contratos. Ao criar uma conta, você declara que as informações fornecidas 
                são verdadeiras e completas.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">3.2. Segurança da Conta</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Você é responsável por manter a confidencialidade de suas credenciais de acesso 
                e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente 
                sobre qualquer uso não autorizado.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">3.3. Contas Empresariais</h3>
              <p className="text-muted-foreground leading-relaxed">
                Se você cria uma conta em nome de uma empresa, declara ter autoridade para 
                vincular essa empresa a estes termos.
              </p>
            </section>

            {/* Seção 4: Planos e Pagamentos */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Planos e Pagamentos</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-2">4.1. Período de Teste</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Novos usuários podem ter acesso a um período de teste gratuito conforme especificado 
                no momento do cadastro. Ao término do período de teste, você deverá escolher um 
                plano pago para continuar utilizando o Serviço.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">4.2. Assinatura</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O Serviço é oferecido através de planos de assinatura mensal ou anual. Os preços 
                e recursos de cada plano estão disponíveis em nossa página de preços.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">4.3. Cobrança e Renovação</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As assinaturas são renovadas automaticamente ao final de cada período, a menos 
                que você cancele antes da data de renovação. Os pagamentos são processados 
                através de provedores terceiros de pagamento.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">4.4. Política de Reembolso</h3>
              <p className="text-muted-foreground leading-relaxed">
                Pagamentos efetuados não são reembolsáveis, exceto quando exigido por lei. 
                O cancelamento encerra o acesso ao final do período já pago.
              </p>
            </section>

            {/* Seção 5: Uso Aceitável */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Uso Aceitável</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ao usar o Serviço, você concorda em NÃO:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Violar leis ou regulamentos aplicáveis</li>
                <li>Usar o Serviço para atividades fraudulentas ou ilegais</li>
                <li>Tentar acessar contas ou dados de outros usuários</li>
                <li>Fazer engenharia reversa, descompilar ou hackear o Serviço</li>
                <li>Sobrecarregar ou interferir na infraestrutura do Serviço</li>
                <li>Usar automação não autorizada (bots, scrapers)</li>
                <li>Compartilhar credenciais de acesso com terceiros</li>
                <li>Importar dados que violem direitos de terceiros</li>
              </ul>
            </section>

            {/* Seção 6: Seus Dados */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Seus Dados</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-2">6.1. Propriedade</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Você mantém todos os direitos sobre os dados que importa para o Serviço. 
                Ao importar dados, você nos concede licença para processar esses dados 
                exclusivamente para fornecer o Serviço.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">6.2. Responsabilidade</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Você é responsável pela legalidade, veracidade e qualidade dos dados importados. 
                O DrGeFin não verifica a precisão dos dados fornecidos por você.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">6.3. Exportação</h3>
              <p className="text-muted-foreground leading-relaxed">
                Você pode exportar seus dados a qualquer momento através das funcionalidades 
                disponíveis na plataforma.
              </p>
            </section>

            {/* Seção 7: Propriedade Intelectual */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O Serviço, incluindo software, design, logotipos, textos e todos os materiais 
                relacionados, são de propriedade exclusiva da DrGeFin e estão protegidos por 
                leis de propriedade intelectual.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Você recebe uma licença limitada, não exclusiva e não transferível para usar 
                o Serviço de acordo com estes termos. Nenhum direito de propriedade é transferido 
                para você.
              </p>
            </section>

            {/* Seção 8: Limitação de Responsabilidade */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitação de Responsabilidade</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-2">8.1. Isenção de Garantias</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O Serviço é fornecido "como está" e "conforme disponível". Não garantimos que 
                o Serviço será ininterrupto, livre de erros ou que atenderá às suas expectativas específicas.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">8.2. Natureza Informativa</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Os insights e análises fornecidos pelo DrGeFin são de natureza informativa e 
                não constituem aconselhamento financeiro, contábil ou jurídico profissional. 
                Decisões de negócio baseadas nas análises são de sua exclusiva responsabilidade.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">8.3. Limite de Indenização</h3>
              <p className="text-muted-foreground leading-relaxed">
                Em nenhuma circunstância a DrGeFin será responsável por danos indiretos, 
                incidentais, especiais ou consequentes. Nossa responsabilidade total está 
                limitada ao valor pago por você nos últimos 12 meses.
              </p>
            </section>

            {/* Seção 9: Rescisão */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Rescisão</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-2">9.1. Por Você</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Você pode cancelar sua conta a qualquer momento através das configurações da 
                plataforma ou entrando em contato conosco. O cancelamento entra em vigor ao 
                final do período de assinatura atual.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">9.2. Por Nós</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Podemos suspender ou encerrar seu acesso imediatamente se você violar estes 
                termos, não efetuar pagamentos, ou se entendermos que sua conta representa 
                risco à segurança do Serviço.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">9.3. Efeitos da Rescisão</h3>
              <p className="text-muted-foreground leading-relaxed">
                Após o encerramento, você perde acesso ao Serviço. Seus dados serão mantidos 
                por 30 dias para possível recuperação, após o que serão excluídos permanentemente.
              </p>
            </section>

            {/* Seção 10: Modificações */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Modificações nos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                Alterações significativas serão comunicadas com antecedência razoável através 
                do e-mail cadastrado ou aviso na plataforma. O uso continuado do Serviço após 
                as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            {/* Seção 11: Disposições Gerais */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Disposições Gerais</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-2">11.1. Lei Aplicável</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Estes termos são regidos pelas leis da República Federativa do Brasil. 
                Qualquer disputa será submetida ao foro da comarca de São Paulo/SP.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">11.2. Acordo Integral</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Estes termos, junto com a Política de Privacidade, constituem o acordo integral 
                entre você e a DrGeFin.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">11.3. Renúncia</h3>
              <p className="text-muted-foreground leading-relaxed">
                A falha em exercer qualquer direito previsto nestes termos não constitui 
                renúncia a esse direito.
              </p>
            </section>

            {/* Seção 12: Contato */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contato</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para dúvidas sobre estes Termos de Uso, entre em contato:
              </p>
              <div className="text-muted-foreground space-y-1">
                <p><strong>E-mail:</strong> <a href="mailto:contato@drgefin.com.br" className="text-primary hover:underline">contato@drgefin.com.br</a></p>
                <p><strong>Suporte:</strong> <a href="mailto:suporte@drgefin.com.br" className="text-primary hover:underline">suporte@drgefin.com.br</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
