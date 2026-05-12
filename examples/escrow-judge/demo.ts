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

interface EscrowReview {
  id: string;
  agreementId: string;
  buyer: string;
  builder: string;
  deliverableUri: string;
  rubric: string[];
  verdict: "release" | "refund" | "needs_revision";
  confidenceBps: number;
  evidenceSummary: string;
  createdAt: string;
}

const escrowJudge = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000021");
const sponsor = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000022");
const merchant = "0x6F6b9aD31125e0054Db94B41c3F181F2C9097F70";
const nonceStore = new Set<string>();

const review: EscrowReview = {
  id: "escrow-review-001",
  agreementId: "arc-builder-bounty-042",
  buyer: "arc-sponsor-desk",
  builder: "agent-builder-team",
  deliverableUri: "ipfs://demo/arc-signal-receipts-walkthrough",
  rubric: ["runs locally", "uses USDC payment intent", "emits signed receipt", "has replay protection"],
  verdict: "release",
  confidenceBps: 9100,
  evidenceSummary: "The submitted demo passed the local build and shows signed receipts plus submitted settlement state.",
  createdAt: new Date().toISOString()
};

const receipt = createReasoningReceipt({
  artifactId: review.id,
  artifact: review,
  signer: escrowJudge.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  metadata: {
    product: "Arc Escrow Judge",
    receiptType: "ai-deliverable-review",
    verdict: review.verdict
  }
});
const signedReceipt = await signReasoningReceipt(escrowJudge, receipt);
const receiptVerification = await verifyReasoningReceipt(signedReceipt);

const intent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: sponsor.address,
  serviceId: "escrow-judge-review",
  amountMicrousd: "2500000",
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    signalId: review.agreementId,
    signalHash: receipt.artifactHash,
    product: "Arc Escrow Judge",
    verdict: review.verdict
  }
});

const signature = await sponsor.signMessage({ message: canonicalIntent(intent) });
const paymentVerification = await verifyMerchantRequest(
  { intent, signature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 5000000n,
    acceptedServices: new Set(["escrow-judge-review"]),
    nonceStore
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(intent, "req_escrow_judge_001");
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
      product: "Arc Escrow Judge",
      angle: "AI-reviewed deliverables with USDC escrow release receipts on Arc.",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      receiptVerification,
      review,
      signedReceipt,
      settlementBatch: submittedBatch,
      dashboard
    },
    null,
    2
  )
);
