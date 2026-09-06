import { anyApi, FunctionReference } from "convex/server";

type User = { _id: string; name: string; email: string; role: string; kycStatus: string; accountStatus: string; createdAt: number };
type Account = { _id: string; type: string; balance: number; availableBalance: number; currency: string; accountNumberMasked: string; status: string };
type Transaction = { _id: string; description: string; category: string; amount: number; currency: string; type: "credit" | "debit"; status: string };
type Card = { _id: string; brand: string; last4: string; isFrozen: boolean; expiryMonth: number; expiryYear: number };
type Transfer = { _id: string; reference: string; beneficiaryName: string; beneficiaryAccount: string; amount: number; currency: string; status: string; riskScore: number; riskReasons: string[] };
type Notification = { _id: string; title: string; body: string; read: boolean; type: string; createdAt: number };
type KycCase = { _id: string; userId: string; status: string; requiredFields: string[]; reviewerNote?: string };
type Dashboard = { user: User; accounts: Account[]; transactions: Transaction[]; cards: Card[]; transfers: Transfer[]; notifications: Notification[] };
type Overview = { pendingKyc: KycCase[]; reviewTransfers: Transfer[]; failedTransfers: Transfer[] };

type Ref<T extends "query" | "mutation", A, R> = FunctionReference<T, "public", A, R>;

export const api = {
  users: { provision: anyApi.users.provision as Ref<"mutation", { name?: string; email?: string }, User | null> },
  banking: {
    dashboard: anyApi.banking.dashboard as Ref<"query", {}, Dashboard>,
    ensureDefaultAccount: anyApi.banking.ensureDefaultAccount as Ref<"mutation", {}, string>,
    toggleCard: anyApi.banking.toggleCard as Ref<"mutation", { cardId: string }, boolean>,
    transfer: anyApi.banking.transfer as Ref<"mutation", { sourceAccountId: string; beneficiaryAccount: string; beneficiaryName: string; amount: number; idempotencyKey: string }, Transfer>,
  },
  notifications: { markAllRead: anyApi.notifications.markAllRead as Ref<"mutation", {}, number> },
  compliance: {
    myKyc: anyApi.compliance.myKyc as Ref<"query", {}, KycCase | null>,
    startKyc: anyApi.compliance.startKyc as Ref<"mutation", {}, KycCase>,
    queue: anyApi.compliance.queue as Ref<"query", { status?: string }, KycCase[]>,
    review: anyApi.compliance.review as Ref<"mutation", { caseId: string; decision: "verified" | "rejected" | "manual_review"; note: string }, KycCase>,
  },
  admin: {
    overview: anyApi.admin.overview as Ref<"query", {}, Overview>,
    resolveTransfer: anyApi.admin.resolveTransfer as Ref<"mutation", { transferId: string; decision: "complete" | "fail"; note: string }, Transfer>,
  },
} as const;
