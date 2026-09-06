export type KycProviderResult = { status: "submitted" | "pending" | "verified" | "rejected" | "manual_review" | "error"; providerReference?: string; requiredFields?: string[]; failureCode?: string; failureMessage?: string };

export interface KycProvider { submit(input: { userId: string; email: string; name: string }): Promise<KycProviderResult>; }
export interface PaymentRailProvider { initiate(input: { reference: string; amount: number; currency: string; beneficiaryAccount: string; beneficiaryName: string }): Promise<{ status: "processing" | "pending" | "failed"; providerReference?: string; failureCode?: string }>; }
export interface NotificationProvider { send(input: { destination: string; subject: string; body: string }): Promise<{ status: "sent" | "failed"; providerReference?: string; error?: string }>; }

export class ManualReviewKycProvider implements KycProvider { async submit(): Promise<KycProviderResult> { return { status: "manual_review", requiredFields: ["legal_name", "date_of_birth", "government_id", "proof_of_address"] }; } }
export class UnconfiguredPaymentRailProvider implements PaymentRailProvider { async initiate(): Promise<{ status: "failed"; failureCode: string }> { return { status: "failed", failureCode: "PAYMENT_PROVIDER_NOT_CONFIGURED" }; } }
export class UnconfiguredNotificationProvider implements NotificationProvider { async send(): Promise<{ status: "failed"; error: string }> { return { status: "failed", error: "NOTIFICATION_PROVIDER_NOT_CONFIGURED" }; } }
