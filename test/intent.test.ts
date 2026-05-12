import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET_CHAIN_ID, canonicalIntent, createPaymentIntent, verifySignedIntent } from "../src/index.js";

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
});
