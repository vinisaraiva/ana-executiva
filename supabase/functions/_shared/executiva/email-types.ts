/** Ana Executiva: contracts only. No Gmail credentials or live API calls. */
export type EmailProvider = "gmail";
export type ApprovalStatus = "draft" | "pending_approval" | "approved" | "sending" | "sent" | "rejected" | "failed";
export interface EmailIdentity {
  userId: string;
  tenantId: string;
  mailboxId: string;
  provider: EmailProvider;
}
export interface EmailMessageSummary {
  providerMessageId: string;
  providerThreadId: string;
  subject: string;
  from: string;
  to: string[];
  receivedAt: string;
  snippet: string;
}
export interface OutboundEmailDraft {
  id: string;
  identity: EmailIdentity;
  threadId: string | null;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  status: ApprovalStatus;
  revision: number;
  approvedRevision: number | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
}
export interface MailProvider {
  search(identity: EmailIdentity, query: string, limit: number): Promise<EmailMessageSummary[]>;
  getThread(identity: EmailIdentity, threadId: string): Promise<EmailMessageSummary[]>;
  sendApprovedDraft(identity: EmailIdentity, draft: OutboundEmailDraft): Promise<{ messageId: string }>;
}
