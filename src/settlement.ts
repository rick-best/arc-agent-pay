import { createHash } from "node:crypto";
import type { FulfilledRequest, HexAddress, SettlementBatch } from "./types.js";

export function createSettlementBatch(merchant: HexAddress, requests: FulfilledRequest[]): SettlementBatch {
  if (requests.length === 0) {
    throw new Error("Cannot create an empty settlement batch");
  }

  const first = requests[0]?.intent;
  if (!first) {
    throw new Error("Missing first payment intent");
  }

  for (const request of requests) {
    if (request.intent.merchant.toLowerCase() !== merchant.toLowerCase()) {
      throw new Error("All requests must use the same merchant");
    }

    if (request.intent.chainId !== first.chainId) {
      throw new Error("All requests must use the same chain");
    }
  }

  const total = requests.reduce((sum, request) => sum + BigInt(request.intent.amountMicrousd), 0n);
  const createdAt = new Date().toISOString();

  return {
    id: batchId(merchant, requests, createdAt),
    merchant,
    chainId: first.chainId,
    paymentAsset: "USDC",
    totalAmountMicrousd: total.toString(),
    requestCount: requests.length,
    status: "created",
    createdAt
  };
}

function batchId(merchant: HexAddress, requests: FulfilledRequest[], createdAt: string): string {
  const hash = createHash("sha256");
  hash.update(merchant.toLowerCase());
  hash.update(createdAt);
  for (const request of requests) {
    hash.update(request.requestId);
    hash.update(request.intent.nonce);
  }
  return `batch_${hash.digest("hex").slice(0, 16)}`;
}

export function submitSettlementBatch(
  batch: SettlementBatch,
  txHash: `0x${string}`,
  submittedAt = new Date().toISOString()
): SettlementBatch {
  if (batch.status !== "created" && batch.status !== "failed") {
    throw new Error(`Cannot submit settlement batch from ${batch.status} status`);
  }

  return {
    ...batch,
    status: "submitted",
    txHash,
    submittedAt,
    failedAt: undefined,
    failureReason: undefined
  };
}

export function confirmSettlementBatch(
  batch: SettlementBatch,
  confirmedAt = new Date().toISOString()
): SettlementBatch {
  if (batch.status !== "submitted") {
    throw new Error(`Cannot confirm settlement batch from ${batch.status} status`);
  }

  return {
    ...batch,
    status: "confirmed",
    confirmedAt
  };
}

export function failSettlementBatch(
  batch: SettlementBatch,
  failureReason: string,
  failedAt = new Date().toISOString()
): SettlementBatch {
  if (batch.status === "confirmed") {
    throw new Error("Cannot fail a confirmed settlement batch");
  }

  return {
    ...batch,
    status: "failed",
    failedAt,
    failureReason
  };
}

export function demoSettlementTxHash(batch: SettlementBatch): `0x${string}` {
  const hash = createHash("sha256");
  hash.update(batch.id);
  hash.update(batch.merchant.toLowerCase());
  hash.update(batch.totalAmountMicrousd);
  hash.update(batch.createdAt);
  return `0x${hash.digest("hex")}`;
}
