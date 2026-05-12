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

interface PolicyDecision {
  id: string;
  actorAgent: string;
  requestedAction: string;
  policyPack: string;
  decision: "allow" | "deny" | "manual_review";
  riskScore: number;
  controls: string[];
  reason: string;
  createdAt: string;
}

const guard = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000041");
const buyer = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000042");
const merchant = "0xD4dd1E65e1C237D192Ab9e5C3956120E112A805a";
const nonceStore = new Set<string>();

const decision: PolicyDecision = {
  id: "policy-decision-001",
  actorAgent: "treasury-agent-usdc-ops",
  requestedAction: "pay a third-party model endpoint for batch invoice classification",
  policyPack: "arc-agent-spend-policy-v1",
  decision: "allow",
  riskScore: 22,
  controls: ["merchant allowlist", "per-request cap", "nonce replay protection", "receipt required"],
  reason: "The request is within the USDC spend cap and targets an approved service with receipt logging enabled.",
  createdAt: new Date().toISOString()
};

const receipt = createReasoningReceipt({
  artifactId: decision.id,
  artifact: decision,
  signer: guard.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  metadata: {
    product: "Arc Policy Guard",
    receiptType: "agent-policy-decision",
    decision: decision.decision
  }
});
const signedReceipt = await signReasoningReceipt(guard, receipt);
const receiptVerification = await verifyReasoningReceipt(signedReceipt);

const intent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: buyer.address,
  serviceId: "policy-guard-check",
  amountMicrousd: "9000",
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    signalId: decision.id,
    signalHash: receipt.artifactHash,
    product: "Arc Policy Guard",
    decision: decision.decision
  }
});

const signature = await buyer.signMessage({ message: canonicalIntent(intent) });
const paymentVerification = await verifyMerchantRequest(
  { intent, signature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 50000n,
    acceptedServices: new Set(["policy-guard-check"]),
    nonceStore
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(intent, "req_policy_guard_001");
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
      product: "Arc Policy Guard",
      angle: "Paid agent spend-policy checks with signed allow/deny receipts on Arc.",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      receiptVerification,
      decision,
      signedReceipt,
      settlementBatch: submittedBatch,
      dashboard
    },
    null,
    2
  )
);
