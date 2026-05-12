import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import {
  ARC_TESTNET_CHAIN_ID,
  canonicalIntent,
  createDashboardSnapshot,
  createPaymentIntent,
  createReasoningReceipt,
  createSettlementBatch,
  demoSettlementTxHash,
  recordFulfilledRequest,
  signReasoningReceipt,
  submitSettlementBatch,
  verifyMerchantRequest,
  verifyReasoningReceipt,
  verifySignedIntent
} from "../src/index.js";

describe("payment intents", () => {
  it("verifies a valid signed intent", async () => {
    const account = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
    const intent = createPaymentIntent({
      chainId: ARC_TESTNET_CHAIN_ID,
      merchant: "0x7eEB8A9e794a30629B376203b97D11D9b7230De6",
      payer: account.address,
      serviceId: "paid-data-api",
      amountMicrousd: "10000",
      nonce: "test-nonce",
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    const signature = await account.signMessage({ message: canonicalIntent(intent) });
    await expect(verifySignedIntent({ intent, signature })).resolves.toEqual({ ok: true });
  });

  it("rejects an expired intent", async () => {
    const account = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
    const intent = createPaymentIntent({
      chainId: ARC_TESTNET_CHAIN_ID,
      merchant: "0x7eEB8A9e794a30629B376203b97D11D9b7230De6",
      payer: account.address,
      serviceId: "paid-data-api",
      amountMicrousd: "10000",
      nonce: "test-nonce",
      expiresAt: new Date(Date.now() - 60_000).toISOString()
    });

    const signature = await account.signMessage({ message: canonicalIntent(intent) });
    await expect(verifySignedIntent({ intent, signature })).resolves.toEqual({ ok: false, reason: "expired" });
  });

  it("rejects replayed merchant nonces", async () => {
    const account = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
    const merchant = "0x7eEB8A9e794a30629B376203b97D11D9b7230De6" as const;
    const nonceStore = new Set<string>();
    const intent = createPaymentIntent({
      chainId: ARC_TESTNET_CHAIN_ID,
      merchant,
      payer: account.address,
      serviceId: "paid-data-api",
      amountMicrousd: "10000",
      nonce: "replay-test-nonce",
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    const signature = await account.signMessage({ message: canonicalIntent(intent) });
    const policy = {
      merchant,
      chainId: ARC_TESTNET_CHAIN_ID,
      maxAmountMicrousd: 100000n,
      acceptedServices: new Set(["paid-data-api"]),
      nonceStore
    };

    await expect(verifyMerchantRequest({ intent, signature }, policy)).resolves.toEqual({ ok: true });
    await expect(verifyMerchantRequest({ intent, signature }, policy)).resolves.toEqual({
      ok: false,
      reason: "replayed_nonce"
    });
  });

  it("signs and verifies deterministic reasoning receipts", async () => {
    const account = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
    const signal = {
      id: "signal-1",
      thesis: "Arc payment intents can unlock market intelligence.",
      confidenceBps: 6200
    };

    const receipt = createReasoningReceipt({
      artifactId: signal.id,
      artifact: signal,
      signer: account.address,
      chainId: ARC_TESTNET_CHAIN_ID,
      createdAt: "2026-05-12T00:00:00.000Z"
    });
    const signed = await signReasoningReceipt(account, receipt);

    expect(receipt.artifactHash).toMatch(/^0x[a-f0-9]{64}$/);
    await expect(verifyReasoningReceipt(signed)).resolves.toEqual({ ok: true });
  });

  it("creates a dashboard snapshot for submitted settlement batches", () => {
    const account = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
    const merchant = "0x7eEB8A9e794a30629B376203b97D11D9b7230De6" as const;
    const intent = createPaymentIntent({
      chainId: ARC_TESTNET_CHAIN_ID,
      merchant,
      payer: account.address,
      serviceId: "agora-signal-receipts",
      amountMicrousd: "50000",
      nonce: "dashboard-test-nonce",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      metadata: {
        signalId: "signal-1",
        signalHash: "0x7d6d0507554a904af0958d9fb4ae61e1be50e6bf352f27f05ca7efc6d2e717e7"
      }
    });
    const fulfilled = recordFulfilledRequest(intent, "request-1");
    const batch = createSettlementBatch(merchant, [fulfilled]);
    const submittedBatch = submitSettlementBatch(batch, demoSettlementTxHash(batch), "2026-05-12T00:01:00.000Z");
    const snapshot = createDashboardSnapshot({
      merchant,
      chainId: ARC_TESTNET_CHAIN_ID,
      fulfilledRequests: [{ ...fulfilled, settlementBatchId: batch.id }],
      batches: [submittedBatch],
      generatedAt: "2026-05-12T00:02:00.000Z"
    });

    expect(snapshot.requestCount).toBe(1);
    expect(snapshot.totalRevenueMicrousd).toBe("50000");
    expect(snapshot.submittedSettlementMicrousd).toBe("50000");
    expect(snapshot.signals[0]?.paymentStatus).toBe("settlement_submitted");
  });
});
