import { createHash } from "node:crypto";
import { verifyMessage, type Account } from "viem";
import type { HexAddress, ReasoningReceipt, SignedReasoningReceipt, VerificationResult } from "./types.js";

export interface CreateReasoningReceiptInput {
  artifactId: string;
  artifact: unknown;
  signer: HexAddress;
  chainId: number;
  expiresAt?: string;
  metadata?: Record<string, string>;
  createdAt?: string;
}

export function createReasoningReceipt(input: CreateReasoningReceiptInput): ReasoningReceipt {
  return {
    version: "arc-signal-receipt-v1",
    artifactId: input.artifactId,
    artifactHash: hashJson(input.artifact),
    signer: input.signer,
    chainId: input.chainId,
    settlementAsset: "USDC",
    createdAt: input.createdAt ?? new Date().toISOString(),
    expiresAt: input.expiresAt,
    metadata: input.metadata
  };
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

export function hashJson(value: unknown): `0x${string}` {
  return `0x${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

export async function signReasoningReceipt(
  account: Account,
  receipt: ReasoningReceipt
): Promise<SignedReasoningReceipt> {
  if (!account.signMessage) {
    throw new Error("Account does not support message signing");
  }

  const signature = await account.signMessage({ message: canonicalJson(receipt) });
  return { receipt, signature };
}

export async function verifyReasoningReceipt(signed: SignedReasoningReceipt): Promise<VerificationResult> {
  const createdAt = Date.parse(signed.receipt.createdAt);
  if (!Number.isFinite(createdAt)) {
    return { ok: false, reason: "invalid_receipt_created_at" };
  }

  if (signed.receipt.expiresAt) {
    const expiresAt = Date.parse(signed.receipt.expiresAt);
    if (!Number.isFinite(expiresAt)) {
      return { ok: false, reason: "invalid_receipt_expiry" };
    }

    if (expiresAt <= Date.now()) {
      return { ok: false, reason: "receipt_expired" };
    }
  }

  const valid = await verifyMessage({
    address: signed.receipt.signer,
    message: canonicalJson(signed.receipt),
    signature: signed.signature
  });

  return valid ? { ok: true } : { ok: false, reason: "invalid_receipt_signature" };
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortObject(nested)])
    );
  }

  return value;
}
