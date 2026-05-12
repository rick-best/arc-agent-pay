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

export interface FulfilledRequest {
  intent: PaymentIntent;
  requestId: string;
  fulfilledAt: string;
  usageUnits: number;
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
}
