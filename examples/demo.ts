import { privateKeyToAccount } from "viem/accounts";
import {
  ARC_TESTNET_CHAIN_ID,
  canonicalIntent,
  createPaymentIntent,
  createSettlementBatch,
  recordFulfilledRequest,
  verifyMerchantRequest
} from "../src/index.js";

const agent = privateKeyToAccount("0x0000000000000000000000000000000000000000000000000000000000000001");
const merchant = "0x7eEB8A9e794a30629B376203b97D11D9b7230De6";

const intent = createPaymentIntent({
  chainId: ARC_TESTNET_CHAIN_ID,
  merchant,
  payer: agent.address,
  serviceId: "paid-weather-api",
  amountMicrousd: "25000",
  nonce: crypto.randomUUID(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  metadata: {
    requestType: "demo"
  }
});

const signature = await agent.signMessage({ message: canonicalIntent(intent) });

const verification = await verifyMerchantRequest(
  { intent, signature },
  {
    merchant,
    chainId: ARC_TESTNET_CHAIN_ID,
    maxAmountMicrousd: 100000n,
    acceptedServices: new Set(["paid-weather-api"])
  }
);

if (!verification.ok) {
  throw new Error(`Payment rejected: ${verification.reason}`);
}

const fulfilled = recordFulfilledRequest(intent, "req_demo_001");
const batch = createSettlementBatch(merchant, [fulfilled]);

console.log(JSON.stringify({ verification, batch }, null, 2));
