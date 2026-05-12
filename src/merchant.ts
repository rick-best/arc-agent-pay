import type { FulfilledRequest, NonceStore, PaymentIntent, SignedPaymentIntent, VerificationResult } from "./types.js";
import { verifySignedIntent } from "./intent.js";

export interface MerchantPolicy {
  merchant: PaymentIntent["merchant"];
  chainId: number;
  maxAmountMicrousd: bigint;
  acceptedServices: Set<string>;
  nonceStore?: NonceStore;
}

export async function verifyMerchantRequest(
  signed: SignedPaymentIntent,
  policy: MerchantPolicy
): Promise<VerificationResult> {
  if (signed.intent.merchant.toLowerCase() !== policy.merchant.toLowerCase()) {
    return { ok: false, reason: "wrong_merchant" };
  }

  if (signed.intent.chainId !== policy.chainId) {
    return { ok: false, reason: "wrong_chain" };
  }

  if (!policy.acceptedServices.has(signed.intent.serviceId)) {
    return { ok: false, reason: "unsupported_service" };
  }

  if (BigInt(signed.intent.amountMicrousd) > policy.maxAmountMicrousd) {
    return { ok: false, reason: "amount_exceeds_policy" };
  }

  if (policy.nonceStore?.has(signed.intent.nonce)) {
    return { ok: false, reason: "replayed_nonce" };
  }

  const result = await verifySignedIntent(signed);
  if (result.ok) {
    policy.nonceStore?.add(signed.intent.nonce);
  }

  return result;
}

export function recordFulfilledRequest(intent: PaymentIntent, requestId: string, usageUnits = 1): FulfilledRequest {
  return {
    intent,
    requestId,
    usageUnits,
    fulfilledAt: new Date().toISOString()
  };
}
