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
  verifyReasoningReceipt,
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

const signalAgent = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
const buyer = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000002");
const merchant = "0x7eEB8A9e794a30629B376203b97D11D9b7230De6";
const nonceStore = new Set<string>();

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

const receipt = createReasoningReceipt({
  artifactId: signal.id,
  artifact: signal,
  signer: signalAgent.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  expiresAt: signal.expiresAt,
  metadata: {
    product: "Arc Signal Receipts",
    receiptType: "market-signal"
  }
});
const signedReceipt = await signReasoningReceipt(signalAgent, receipt);
const receiptVerification = await verifyReasoningReceipt(signedReceipt);

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
    signalHash: receipt.artifactHash,
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
    acceptedServices: new Set(["agora-signal-receipts"]),
    nonceStore
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(paymentIntent, "req_agora_signal_001");
const batch = createSettlementBatch(merchant, [fulfilled]);
const fulfilledWithBatch = { ...fulfilled, settlementBatchId: batch.id };
const submittedBatch = submitSettlementBatch(batch, demoSettlementTxHash(batch));
const dashboard = createDashboardSnapshot({
  merchant,
  chainId: ARC_TESTNET_CHAIN_ID,
  fulfilledRequests: [fulfilledWithBatch],
  batches: [submittedBatch]
});

console.log(
  JSON.stringify(
    {
      product: "Arc Signal Receipts",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      receiptVerification,
      signalReceipt: signedReceipt.receipt,
      receiptSignature: signedReceipt.signature,
      unlockedSignal: signal,
      settlementBatch: submittedBatch,
      dashboard
    },
    null,
    2
  )
);
