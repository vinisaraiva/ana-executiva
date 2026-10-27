/**
 * @fileoverview Política de Privacidade - DrGeFin
 * 
 * Página legal com a política de privacidade do DrGeFin,
 * em conformidade com a LGPD (Lei Geral de Proteção de Dados).
 * 
 * Conteúdo inclui:
 * - Introdução e compromisso com privacidade
 * - Dados coletados (cadastro, vendas, uso)
 * - Como os dados são utilizados
 * - Base legal para processamento
 * - Compartilhamento de dados
 * - Medidas de segurança
 * - Direitos do usuário (LGPD)
 * - Política de cookies
 * - Informações de contato
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
 * Página de Política de Privacidade.
 * 
 * Documento legal que explica como o DrGeFin coleta, usa,
 * armazena e protege os dados pessoais dos usuários.
 */
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Cabeçalho da página */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Política de Privacidade</h1>
            <p className="text-muted-foreground">Última atualização: 28 de dezembro de 2024</p>
          </div>

          <div className="space-y-8">
            {/* Seção 1: Introdução */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A DrGeFin ("nós", "nosso" ou "Empresa") está comprometida em proteger sua privacidade. 
                Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos 
                suas informações pessoais quando você utiliza nossa plataforma de análise financeira 
                com inteligência artificial.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política, 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            {/* Seção 2: Dados Coletados */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Dados Coletados</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Coletamos os seguintes tipos de informações:
              </p>
              
              <h3 className="text-lg font-medium text-foreground mb-2">2.1. Dados de Cadastro</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Nome da empresa</li>
                <li>Setor de atuação</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-2">2.2. Dados de Vendas</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                <li>Informações de transações comerciais importadas por você</li>
                <li>Dados de produtos, clientes, vendedores e canais de venda</li>
                <li>Valores de receita, custos, margens e impostos</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-2">2.3. Dados de Uso</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Histórico de conversas com a IA</li>
                <li>Logs de acesso e ações na plataforma</li>
                <li>Informações do dispositivo e navegador</li>
              </ul>
            </section>

            {/* Seção 3: Como Usamos os Dados */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Como Usamos Seus Dados</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Fornecer análises e insights personalizados sobre seus dados de vendas</li>
                <li>Processar e responder suas perguntas através do assistente de IA</li>
                <li>Identificar anomalias e oportunidades de melhoria nos seus resultados</li>
                <li>Manter e melhorar a qualidade do serviço</li>
                <li>Enviar comunicações importantes sobre sua conta</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            {/* Seção 4: Base Legal */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Base Legal para Processamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Execução de contrato:</strong> para fornecer os serviços contratados</li>
                <li><strong>Consentimento:</strong> para envio de comunicações de marketing</li>
                <li><strong>Legítimo interesse:</strong> para melhorias no serviço e segurança</li>
                <li><strong>Cumprimento de obrigação legal:</strong> para atender exigências regulatórias</li>
              </ul>
            </section>

            {/* Seção 5: Compartilhamento */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar dados apenas:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Com provedores de serviços essenciais (hospedagem, processamento de pagamentos)</li>
                <li>Com provedores de IA para processamento de linguagem natural</li>
                <li>Quando exigido por lei ou ordem judicial</li>
                <li>Para proteger nossos direitos legais</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Todos os nossos parceiros estão sujeitos a acordos de confidencialidade e proteção de dados.
              </p>
            </section>

            {/* Seção 6: Segurança */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Criptografia em trânsito (TLS/HTTPS) e em repouso</li>
                <li>Autenticação segura e controle de acesso</li>
                <li>Isolamento de dados por empresa (multi-tenant)</li>
                <li>Backups regulares e recuperação de desastres</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Logs de auditoria para rastreabilidade</li>
              </ul>
            </section>

            {/* Seção 7: Retenção */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Armazenamento e Retenção</h2>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados são armazenados em servidores seguros enquanto sua conta estiver ativa. 
                Após o encerramento da conta, mantemos os dados por até 30 dias para fins de backup 
                e recuperação. Dados de transações podem ser retidos por períodos maiores para 
                cumprimento de obrigações fiscais e legais.
              </p>
            </section>

            {/* Seção 8: Direitos LGPD */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                De acordo com a LGPD, você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Acesso:</strong> solicitar informações sobre o tratamento dos seus dados</li>
                <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização:</strong> solicitar anonimização de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
                <li><strong>Eliminação:</strong> solicitar exclusão dos dados tratados com consentimento</li>
                <li><strong>Revogação:</strong> revogar o consentimento a qualquer momento</li>
                <li><strong>Informação:</strong> saber com quem seus dados são compartilhados</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Para exercer qualquer desses direitos, entre em contato através do e-mail: 
                <a href="mailto:privacidade@drgefin.com.br" className="text-primary hover:underline ml-1">
                  privacidade@drgefin.com.br
                </a>
              </p>
            </section>

            {/* Seção 9: Cookies */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Manter você logado na plataforma</li>
                <li>Lembrar suas preferências</li>
                <li>Analisar o uso do serviço para melhorias</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Você pode gerenciar os cookies através das configurações do seu navegador.
              </p>
            </section>

            {/* Seção 10: Alterações */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Alterações nesta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você 
                sobre alterações significativas através do e-mail cadastrado ou por meio de aviso 
                destacado na plataforma. Recomendamos revisar esta página regularmente.
              </p>
            </section>

            {/* Seção 11: Contato */}
            <section className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contato</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento 
                dos seus dados, entre em contato conosco:
              </p>
              <div className="text-muted-foreground space-y-1">
                <p><strong>E-mail:</strong> <a href="mailto:privacidade@drgefin.com.br" className="text-primary hover:underline">privacidade@drgefin.com.br</a></p>
                <p><strong>Encarregado de Dados (DPO):</strong> dpo@drgefin.com.br</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
