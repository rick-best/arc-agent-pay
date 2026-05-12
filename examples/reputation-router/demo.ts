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
  verifyReasoningReceipt
} from "../../src/index.js";

interface AgentRouteDecision {
  id: string;
  task: string;
  selectedAgent: string;
  candidates: Array<{
    agent: string;
    reputationScore: number;
    quotedMicrousd: string;
    latencyMs: number;
  }>;
  routingReason: string;
  createdAt: string;
}

const router = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000031");
const buyer = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000032");
const merchant = "0xCE5C8E17ACc558375e6BdEFd7a58f36364a9FCE8";
const nonceStore = new Set<string>();

const route: AgentRouteDecision = {
  id: "route-decision-001",
  task: "choose a paid research agent for an Arc testnet integration answer",
  selectedAgent: "arc-docs-researcher-v2",
  candidates: [
    { agent: "arc-docs-researcher-v2", reputationScore: 94, quotedMicrousd: "18000", latencyMs: 820 },
    { agent: "generic-web-researcher", reputationScore: 76, quotedMicrousd: "12000", latencyMs: 630 },
    { agent: "slow-deep-researcher", reputationScore: 88, quotedMicrousd: "26000", latencyMs: 2100 }
  ],
  routingReason:
    "Selected the highest reputation-to-price candidate with Arc-specific source history and acceptable latency.",
  createdAt: new Date().toISOString()
};

const selected = route.candidates.find((candidate) => candidate.agent === route.selectedAgent);
if (!selected) {
  throw new Error("Selected agent missing from candidates");
}

const receipt = createReasoningReceipt({
  artifactId: route.id,
  artifact: route,
  signer: router.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  metadata: {
    product: "Arc Reputation Router",
    receiptType: "agent-route-decision",
    selectedAgent: route.selectedAgent
  }
});
const signedReceipt = await signReasoningReceipt(router, receipt);
const receiptVerification = await verifyReasoningReceipt(signedReceipt);

const intent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: buyer.address,
  serviceId: "reputation-router",
  amountMicrousd: selected.quotedMicrousd,
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    signalId: route.id,
    signalHash: receipt.artifactHash,
    product: "Arc Reputation Router",
    selectedAgent: route.selectedAgent
  }
});

const signature = await buyer.signMessage({ message: canonicalIntent(intent) });
const paymentVerification = await verifyMerchantRequest(
  { intent, signature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 100000n,
    acceptedServices: new Set(["reputation-router"]),
    nonceStore
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(intent, "req_reputation_router_001");
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
      product: "Arc Reputation Router",
      angle: "Paid agent routing with signed reputation decisions and USDC settlement on Arc.",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      receiptVerification,
      route,
      signedReceipt,
      settlementBatch: submittedBatch,
      dashboard
    },
    null,
    2
  )
);
