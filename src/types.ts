export type HexAddress = `0x${string}`;

export interface PaymentIntent {
  version: "arc-agent-pay-v1";
  chainId: number;
  paymentAsset: "USDC";
  merchant: HexAddress;
  payer: HexAddress;
  serviceId: string;
  amountMicrousd: string;
  nonce: string;
  expiresAt: string;
  metadata?: Record<string, string>;
}

export interface SignedPaymentIntent {
  intent: PaymentIntent;
  signature: `0x${string}`;
}

export interface VerificationResult {
  ok: boolean;
  reason?: string;
}

export interface NonceStore {
  has(nonce: string): boolean;
  add(nonce: string): void;
}

export interface FulfilledRequest {
  intent: PaymentIntent;
  requestId: string;
  fulfilledAt: string;
  usageUnits: number;
  settlementBatchId?: string;
}

export interface SettlementBatch {
  id: string;
  merchant: HexAddress;
  chainId: number;
  paymentAsset: "USDC";
  totalAmountMicrousd: string;
  requestCount: number;
  status: "created" | "submitted" | "confirmed" | "failed";
  txHash?: `0x${string}`;
  createdAt: string;
  submittedAt?: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface ReasoningReceipt {
  version: "arc-signal-receipt-v1";
  artifactId: string;
  artifactHash: `0x${string}`;
  signer: HexAddress;
  chainId: number;
  settlementAsset: "USDC";
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export interface SignedReasoningReceipt {
  receipt: ReasoningReceipt;
  signature: `0x${string}`;
}

export interface DashboardSignalRow {
  signalId: string;
  signalHash: `0x${string}`;
  paymentStatus: "verified" | "rejected" | "settlement_pending" | "settlement_submitted" | "settlement_confirmed" | "settlement_failed";
  settlementBatchId?: string;
  txHash?: `0x${string}`;
  amountMicrousd: string;
  createdAt: string;
}

export interface DashboardSnapshot {
  generatedAt: string;
  merchant: HexAddress;
  chainId: number;
  paymentAsset: "USDC";
  requestCount: number;
  batchCount: number;
  totalRevenueMicrousd: string;
  pendingSettlementMicrousd: string;
  submittedSettlementMicrousd: string;
  confirmedSettlementMicrousd: string;
  failedSettlementMicrousd: string;
  signals: DashboardSignalRow[];
}
