import type { EmailIdentity, OutboundEmailDraft } from "./email-types.ts";

/** Pure checks; all approval state changes must be persisted atomically in the database. */
export function assertCanSendDraft(identity: EmailIdentity, draft: OutboundEmailDraft): void {
  if (!identity.userId || !identity.tenantId || !identity.mailboxId) {
    throw new Error("Identidade de e-mail incompleta");
  }
  if (
    identity.userId !== draft.identity.userId ||
    identity.tenantId !== draft.identity.tenantId ||
    identity.mailboxId !== draft.identity.mailboxId
  ) {
    throw new Error("Acesso negado: caixa de e-mail diferente");
  }
  if (draft.status !== "approved") {
    throw new Error("Envio bloqueado: rascunho ainda não aprovado");
  }
  if (draft.approvedByUserId !== identity.userId) {
    throw new Error("Envio bloqueado: aprovação pertence a outro usuário");
  }
  if (draft.approvedRevision !== draft.revision || !draft.approvedAt) {
    throw new Error("Envio bloqueado: edição posterior à aprovação");
  }
  if (draft.to.length === 0 || !draft.to.every((s) => s.trim().length > 0)) {
    throw new Error("Envio bloqueado: destinatário ausente");
  }
}

export function invalidateApprovalOnEdit(draft: OutboundEmailDraft): OutboundEmailDraft {
  return {
    ...draft,
    status: "draft",
    revision: draft.revision + 1,
    approvedRevision: null,
    approvedByUserId: null,
    approvedAt: null,
  };
}
