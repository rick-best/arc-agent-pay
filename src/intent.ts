import { verifyMessage } from "viem";
import type { PaymentIntent, SignedPaymentIntent, VerificationResult } from "./types.js";

export const ARC_TESTNET_CHAIN_ID = 5042002;

export function createPaymentIntent(input: Omit<PaymentIntent, "version" | "paymentAsset">): PaymentIntent {
  return {
    version: "arc-agent-pay-v1",
    paymentAsset: "USDC",
    ...input
  };
}

export function canonicalIntent(intent: PaymentIntent): string {
  return JSON.stringify(sortObject(intent));
}

export async function verifySignedIntent(signed: SignedPaymentIntent): Promise<VerificationResult> {
  const expiresAt = Date.parse(signed.intent.expiresAt);
  if (!Number.isFinite(expiresAt)) {
    return { ok: false, reason: "invalid_expiry" };
  }

  if (expiresAt <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (signed.intent.paymentAsset !== "USDC") {
    return { ok: false, reason: "unsupported_asset" };
  }

  const valid = await verifyMessage({
    address: signed.intent.payer,
    message: canonicalIntent(signed.intent),
    signature: signed.signature
  });

  return valid ? { ok: true } : { ok: false, reason: "invalid_signature" };
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortObject(nested)])
    );
  }

  return value;
}

