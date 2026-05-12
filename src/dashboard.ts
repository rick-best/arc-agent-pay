import type {
  DashboardSignalRow,
  DashboardSnapshot,
  FulfilledRequest,
  HexAddress,
  SettlementBatch
} from "./types.js";

export interface CreateDashboardSnapshotInput {
  merchant: HexAddress;
  chainId: number;
  fulfilledRequests: FulfilledRequest[];
  batches: SettlementBatch[];
  generatedAt?: string;
}

export function createDashboardSnapshot(input: CreateDashboardSnapshotInput): DashboardSnapshot {
  const matchingBatches = input.batches.filter(
    (batch) => batch.merchant.toLowerCase() === input.merchant.toLowerCase() && batch.chainId === input.chainId
  );

  const signals = input.fulfilledRequests.map((request) => signalRow(request, matchingBatches));

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    merchant: input.merchant,
    chainId: input.chainId,
    paymentAsset: "USDC",
    requestCount: input.fulfilledRequests.length,
    batchCount: matchingBatches.length,
    totalRevenueMicrousd: sumRequests(input.fulfilledRequests).toString(),
    pendingSettlementMicrousd: sumBatches(matchingBatches, "created").toString(),
    submittedSettlementMicrousd: sumBatches(matchingBatches, "submitted").toString(),
    confirmedSettlementMicrousd: sumBatches(matchingBatches, "confirmed").toString(),
    failedSettlementMicrousd: sumBatches(matchingBatches, "failed").toString(),
    signals
  };
}

function signalRow(request: FulfilledRequest, batches: SettlementBatch[]): DashboardSignalRow {
  const batch = batches.find((candidate) => candidate.id === request.settlementBatchId);
  const signalId = request.intent.metadata?.signalId ?? request.requestId;
  const signalHash = request.intent.metadata?.signalHash as `0x${string}` | undefined;

  return {
    signalId,
    signalHash: signalHash ?? "0x",
    paymentStatus: batch ? settlementStatus(batch.status) : "settlement_pending",
    settlementBatchId: batch?.id ?? request.settlementBatchId,
    txHash: batch?.txHash,
    amountMicrousd: request.intent.amountMicrousd,
    createdAt: request.fulfilledAt
  };
}

function settlementStatus(status: SettlementBatch["status"]): DashboardSignalRow["paymentStatus"] {
  if (status === "created") {
    return "settlement_pending";
  }

  if (status === "submitted") {
    return "settlement_submitted";
  }

  if (status === "confirmed") {
    return "settlement_confirmed";
  }

  return "settlement_failed";
}

function sumRequests(requests: FulfilledRequest[]): bigint {
  return requests.reduce((sum, request) => sum + BigInt(request.intent.amountMicrousd), 0n);
}

function sumBatches(batches: SettlementBatch[], status: SettlementBatch["status"]): bigint {
  return batches
    .filter((batch) => batch.status === status)
    .reduce((sum, batch) => sum + BigInt(batch.totalAmountMicrousd), 0n);
}
