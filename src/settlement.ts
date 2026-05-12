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
