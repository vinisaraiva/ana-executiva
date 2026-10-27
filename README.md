# Ana Executiva — base de desenvolvimento

Este repositório é uma **cópia parcial de código** do GeFIN (`vinisaraiva/data-weaver`). O GeFIN original permanece independente e não deve ser alterado pela adaptação da Ana.

## Situação da migração
- Frontend React/Vite/TypeScript, componentes administrativos e módulos de IA copiados.
- Edge Function `supabase/functions/whatsapp-webhook/index.ts` copiada como **referência**, não homologada para produção.
- 13 migrações SQL do projeto original ainda não foram transferidas.
- Imagens/ícones binários, `bun.lockb` e `.env` não foram transferidos.
- A aplicação **não está pronta para deploy** nem conectada a um Supabase exclusivo.

## Configuração isolada obrigatória
1. Tornar o repositório **privado** antes de prosseguir com dados reais.
2. Criar um projeto Supabase **novo** para a Ana. Nunca usar as credenciais ou o banco do GeFIN.
3. Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente (consultar `.env.example`).
4. Atualizar `supabase/config.toml` com o project ref **da Ana** antes de fazer link/deploy.
5. Revisar e adaptar as migrações, políticas RLS, tenant memberships e Edge Functions antes de aplicar qualquer mudança ao banco.
6. Preparar conta Google OAuth/Gmail e aprovação explícita de cada envio de e-mail.
7. Validar assinatura de webhook da Meta, idempotência e associação segura telefone ↔ usuário antes de qualquer acesso a e-mails.
8. Somente depois de testar em ambiente isolado, planejar a transferência do número de WhatsApp.

## Segurança
- Não comitar `.env`, chaves de serviço, tokens Meta ou OAuth.
- Os segredos das Edge Functions devem ser configurados no projeto Supabase **novo**.
- Não transportar dados financeiros ou de clientes do GeFIN para a Ana.
- A migração foi feita como **novo histórico Git**, sem espelhar o histórico do GeFIN.

## Nota
Partes do código e textos da UI ainda usam a identidade GeFIN. A separação comercial e técnica ainda precisa ser concluída.
