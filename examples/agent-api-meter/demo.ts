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

interface MeteredEndpointCall {
  id: string;
  endpoint: string;
  buyerAgent: string;
  units: number;
  unitPriceMicrousd: string;
  payloadHashLabel: string;
  responseSummary: string;
  createdAt: string;
}

const sellerAgent = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000011");
const buyerAgent = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000012");
const merchant = "0x24F1f7E0E986AD51B89A44298783aB6C4f6A1E71";
const nonceStore = new Set<string>();

const call: MeteredEndpointCall = {
  id: "api-meter-call-001",
  endpoint: "agent-marketplace/social-intelligence-v1",
  buyerAgent: "research-agent-alpha",
  units: 37,
  unitPriceMicrousd: "1250",
  payloadHashLabel: "prompt:vibe-card-adoption-scan",
  responseSummary: "Returned a bounded social-intelligence summary with source labels and freshness metadata.",
  createdAt: new Date().toISOString()
};

const receipt = createReasoningReceipt({
  artifactId: call.id,
  artifact: call,
  signer: sellerAgent.address,
  chainId: ARC_TESTNET_CHAIN_ID,
  metadata: {
    product: "Arc Agent API Meter",
    receiptType: "metered-api-call",
    endpoint: call.endpoint
  }
});
const signedReceipt = await signReasoningReceipt(sellerAgent, receipt);
const receiptVerification = await verifyReasoningReceipt(signedReceipt);

const amountMicrousd = (BigInt(call.unitPriceMicrousd) * BigInt(call.units)).toString();
const intent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: buyerAgent.address,
  serviceId: "agent-api-meter",
  amountMicrousd,
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    signalId: call.id,
    signalHash: receipt.artifactHash,
    product: "Arc Agent API Meter",
    units: call.units.toString()
  }
});

const signature = await buyerAgent.signMessage({ message: canonicalIntent(intent) });
const paymentVerification = await verifyMerchantRequest(
  { intent, signature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 100000n,
    acceptedServices: new Set(["agent-api-meter"]),
    nonceStore
  }
);

if (!paymentVerification.ok) {
  throw new Error(`Payment rejected: ${paymentVerification.reason}`);
}

const fulfilled = recordFulfilledRequest(intent, "req_api_meter_001", call.units);
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
      product: "Arc Agent API Meter",
      angle: "Usage-based paid API calls for agent marketplaces on Arc.",
      chainId: ARC_TESTNET_CHAIN_ID,
      paymentVerification,
      receiptVerification,
      meteredCall: call,
      signedReceipt,
      settlementBatch: submittedBatch,
      dashboard
    },
    null,
    2
  )
);
