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

interface SubscriptionRenewal {
  id: string;
  subscriberAgent: string;
  service: string;
  billingPeriod: string;
  renewalDecision: "renew" | "pause" | "cancel";
  entitlement: string;
  usageLastPeriod: number;
  createdAt: string;
}

const subscriptionManager = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000051"
);
const subscriber = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000052");
const merchant = "0xAb8E6AC95C4292D6AaA1573B673B66479a207CF8";
const nonceStore = new Set<string>();

const renewal: SubscriptionRenewal = {
  id: "subscription-renewal-001",
  subscriberAgent: "portfolio-monitor-agent",
  service: "arc-risk-alerts-pro",
  billingPeriod: "2026-05",
  renewalDecision: "renew",
  entitlement: "500 alert evaluations",
  usageLastPeriod: 418,
  createdAt: new Date().toISOString()
};

const receipt = createReasoningReceipt({
  artifactId: renewal.id,
  artifact: renewal,
  signer: subscriptionManager.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  metadata: {
    product: "Arc Subscription Agent",
    receiptType: "subscription-renewal",
    billingPeriod: renewal.billingPeriod
  }
});
const signedReceipt = await signReasoningReceipt(subscriptionManager, receipt);
const receiptVerification = await verifyReasoningReceipt(signedReceipt);

const intent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: subscriber.address,
  serviceId: "subscription-agent-renewal",
  amountMicrousd: "1200000",
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    signalId: renewal.id,
    signalHash: receipt.artifactHash,
    product: "Arc Subscription Agent",
    billingPeriod: renewal.billingPeriod
  }
});

const signature = await subscriber.signMessage({ message: canonicalIntent(intent) });
const paymentVerification = await verifyMerchantRequest(
  { intent, signature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 2000000n,
    acceptedServices: new Set(["subscription-agent-renewal"]),
    nonceStore
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(intent, "req_subscription_agent_001");
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
      product: "Arc Subscription Agent",
      angle: "Autonomous USDC renewals for agent services with signed entitlement receipts on Arc.",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      receiptVerification,
      renewal,
      signedReceipt,
      settlementBatch: submittedBatch,
      dashboard
    },
    null,
    2
  )
);
