# Ana Executiva — estado técnico

## Implementado nesta etapa
- Landing page específica da Ana, com demonstração **ilustrativa**, sem prometer integração pronta.
- Nova navegação: visão geral, correspondências, briefings, configurações.
- Painel sem indicadores financeiros e sem dados simulados.
- Tela de correspondências deixando explícito que o Gmail não está conectado.
- Tela de briefing deixando explícito que não há agendamento ou envio ativo.
- Login simplificado via Supabase Auth já existente no código, dependente de configurar o projeto exclusivo.
- Arquitetura preliminar de rascunhos e aprovação em `supabase/functions/_shared/executiva/`.

## Limitações deliberadas
- Repositório ainda público; nenhum segredo foi configurado.
- Supabase da Ana ainda não fornecido, logo não foi realizado deploy, nem teste ponta a ponta.
- Código financeiro legado continua em arquivos do projeto para ser removido somente após revisão das dependências.
- O webhook WhatsApp herdado **não deve ser implantado sem revisão** de assinatura Meta, idempotência, validação do usuário e refatoração do processamento financeiro.
- O código `src/integrations/supabase/types.ts` ainda representa o esquema antigo, exigindo regeneração após as novas migrações.
- Treze migrações do GeFIN original continuam ausentes; não aplicar migrações legadas diretamente ao banco novo.
- A tela admin legada ainda existe, mas será reavaliada na fase de administração.
- Não há fluxo de produção de Google OAuth nem envio de Gmail.

## Sequência recomendada
1. Tornar o GitHub privado.
2. Criar Supabase dedicado.
3. Modelar esquema Ana: usuários, contas de e-mail, rascunhos, aprovações, mensagens, briefings e auditoria, com RLS.
4. Implementar Gmail OAuth no backend, nunca no navegador para armazenar refresh tokens.
5. Reestruturar webhook Meta e integrar conversa segura com ferramentas de e-mail.
6. Criar testes automáticos dos fluxos de autorização e envio.
