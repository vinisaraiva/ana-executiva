# Migração do GeFIN para Ana Executiva

Status: **fundação em desenvolvimento — não apta à produção.**

## Preservado
- Repositório original `vinisaraiva/data-weaver` não deve sofrer alterações.
- Implementação de WhatsApp, áudio e chat copiada para estudo e futura refatoração.
- Frontend React/Vite e estrutura de tenants servem de ponto de partida.

## Ainda pendente
1. **Privacidade:** tornar este repositório privado.
2. **Migrações:** concluir a revisão e incorporação de 13 migrações SQL ainda ausentes; não rodar migrações incompletas.
3. **Instância isolada:** provisionar Supabase exclusivo e configurar chaves próprias.
4. **Segurança WhatsApp:** validar HMAC do webhook Meta, idempotência por message ID, quotas, rate limiting e vínculo seguro do telefone à identidade autenticada.
5. **Gmail:** configurar OAuth Google, armazenar tokens criptografados no backend, aplicar escopos mínimos e isolar cada mailbox por user_id e tenant_id.
6. **Envio:** persistir rascunho e aprovação humana explícita da revisão exata; envio idempotente com confirmação e trilha de auditoria.
7. **Proatividade:** criar templates WhatsApp aprovados e agendador de briefings; não enviar texto livre fora da janela aplicável.
8. **Produto:** substituir textos, imagens e funcionalidades financeiras por funcionalidades executivas.
9. **Testes:** integração, RLS, simulação multiusuário, segurança, transcrição, autorização e fluxos ponta a ponta.

## Módulos iniciais adicionados
- `supabase/functions/_shared/executiva/email-types.ts`: contratos de mailboxes, threads e drafts.
- `supabase/functions/_shared/executiva/email-approval.ts`: validações de segurança para futura operação de envio.

Estes módulos **não integram Gmail** nem executam envio. São a base para implementação posterior.

## Não copiar / não fazer
- Nunca copiar `.env` ou tokens do GeFIN.
- Não apontar `supabase/config.toml` para projeto GeFIN.
- Não migrar dados financeiros nem mensagens dos antigos usuários sem base legal e consentimentos adequados.
- Não publicar templates ou ativar webhooks em produção antes do isolamento do ambiente.
