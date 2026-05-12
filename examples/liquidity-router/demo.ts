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

interface LiquidityRoutePlan {
  id: string;
  sourceNetwork: string;
  destinationNetwork: string;
  asset: "USDC";
  amountMicrousd: string;
  routeType: "gateway-balance" | "cctp-transfer" | "native-arc-balance";
  expectedSettlementSeconds: number;
  reason: string;
  createdAt: string;
}

const router = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000061");
const operator = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000062");
const merchant = "0x86A40D4eA9886402973d88DD47D1F6A72D9233f0";
const nonceStore = new Set<string>();

const plan: LiquidityRoutePlan = {
  id: "liquidity-route-001",
  sourceNetwork: "Base",
  destinationNetwork: "Arc Testnet",
  asset: "USDC",
  amountMicrousd: "7500000",
  routeType: "gateway-balance",
  expectedSettlementSeconds: 12,
  reason:
    "Use Gateway-style balance abstraction for low-latency agent funding; fall back to CCTP transfer if balance is unavailable.",
  createdAt: new Date().toISOString()
};

const receipt = createReasoningReceipt({
  artifactId: plan.id,
  artifact: plan,
  signer: router.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  metadata: {
    product: "Arc Liquidity Router",
    receiptType: "funding-route-plan",
    routeType: plan.routeType
  }
});
const signedReceipt = await signReasoningReceipt(router, receipt);
const receiptVerification = await verifyReasoningReceipt(signedReceipt);

const intent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: operator.address,
  serviceId: "liquidity-router-plan",
  amountMicrousd: "35000",
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    signalId: plan.id,
    signalHash: receipt.artifactHash,
    product: "Arc Liquidity Router",
    routeType: plan.routeType
  }
});

const signature = await operator.signMessage({ message: canonicalIntent(intent) });
const paymentVerification = await verifyMerchantRequest(
  { intent, signature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 100000n,
    acceptedServices: new Set(["liquidity-router-plan"]),
    nonceStore
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(intent, "req_liquidity_router_001");
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
      product: "Arc Liquidity Router",
      angle: "Agent funding route plans for USDC liquidity moving toward Arc settlement.",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      receiptVerification,
      plan,
      signedReceipt,
      settlementBatch: submittedBatch,
      dashboard
    },
    null,
    2
  )
);
