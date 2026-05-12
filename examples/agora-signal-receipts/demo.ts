import { createHash } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
import {
  ARC_TESTNET_CHAIN_ID,
  canonicalIntent,
  createPaymentIntent,
  createSettlementBatch,
  recordFulfilledRequest,
  verifyMerchantRequest
} from "../../src/index.js";

interface MarketSignal {
  id: string;
  topic: string;
  marketQuestion: string;
  thesis: string;
  confidenceBps: number;
  riskLevel: "low" | "medium" | "high";
  sources: string[];
  expiresAt: string;
  createdAt: string;
}

interface SignalReceipt {
  version: "arc-signal-receipt-v1";
  signalId: string;
  signalHash: `0x${string}`;
  signer: `0x${string}`;
  chainId: number;
  settlementAsset: "USDC";
  createdAt: string;
}

const signalAgent = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
const buyer = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000002");
const merchant = "0x7eEB8A9e794a30629B376203b97D11D9b7230De6";

const signal: MarketSignal = {
  id: "agora-signal-001",
  topic: "prediction-market-intelligence",
  marketQuestion: "Will an agentic markets project place in the Agora Agents Hackathon?",
  thesis:
    "Projects with working settlement, signed reasoning receipts, and user-facing feedback loops map closely to the hackathon judging criteria.",
  confidenceBps: 6400,
  riskLevel: "medium",
  sources: ["official-agora-rfbs", "arc-docs", "circle-developer-grants"],
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString()
};

const signalHash = hashJson(signal);
const receipt: SignalReceipt = {
  version: "arc-signal-receipt-v1",
  signalId: signal.id,
  signalHash,
  signer: signalAgent.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  settlementAsset: "USDC",
  createdAt: new Date().toISOString()
};

const receiptSignature = await signalAgent.signMessage({ message: canonicalJson(receipt) });

const paymentIntent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: buyer.address,
  serviceId: "agora-signal-receipts",
  amountMicrousd: "50000",
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    signalId: signal.id,
    signalHash,
    product: "Arc Signal Receipts"
  }
});

const paymentSignature = await buyer.signMessage({ message: canonicalIntent(paymentIntent) });
const paymentVerification = await verifyMerchantRequest(
  { intent: paymentIntent, signature: paymentSignature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 100000n,
    acceptedServices: new Set(["agora-signal-receipts"])
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(paymentIntent, "req_agora_signal_001");
const batch = createSettlementBatch(merchant, [fulfilled]);

console.log(
  JSON.stringify(
    {
      product: "Arc Signal Receipts",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      signalReceipt: receipt,
      receiptSignature,
      unlockedSignal: signal,
      settlementBatch: batch
    },
    null,
    2
  )
);

function hashJson(value: unknown): `0x${string}` {
  return `0x${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortObject(value));
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
