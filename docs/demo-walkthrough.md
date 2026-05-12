# ArcAgent Pay Demo Walkthrough

This document is a technical walkthrough for the current prototype. It is intended to accompany the Circle Developer Grants application until a short screen-recorded video is produced.

## Repository

https://github.com/rick-best/arc-agent-pay

## Demo Goal

Show how an AI agent can create a signed payment intent for a paid API request, how a merchant verifies that intent, and how fulfilled usage can be batched for later Arc Testnet settlement.

## Local Setup

```bash
npm install
npm run build
npm test
npm run demo
```

## What The Demo Shows

1. A merchant account is represented by the Arc Testnet wallet:

   `0x7eEB8A9e794a30629B376203b97D11D9b7230De6`

2. An agent creates a payment intent with:

   - merchant address
   - service ID
   - USDC-denominated amount
   - chain ID `5042002`
   - expiry timestamp
   - nonce

3. The intent is serialized into a canonical payload so the same intent always produces the same signing message.

4. The merchant verifies:

   - signature validity
   - service binding
   - merchant binding
   - expiry
   - replay protection through nonce tracking

5. A fulfilled request is recorded.

6. Fulfilled records are grouped into a settlement batch with total amount, payment asset, status, and timestamps.

## Current Test Coverage

The current test suite checks:

- Canonical payment-intent generation.
- Signed intent verification.
- Replay rejection.
- Expired intent rejection.

## Current Demo Output

The current local demo prints a successful verification result and a settlement batch summary for Arc Testnet.

Expected high-level result:

```text
verification: ok
chainId: 5042002
paymentAsset: USDC
totalAmountMicrousd: 25000
status: pending
```

## Circle / Arc Integration Roadmap

The current implementation is deliberately testnet-first and avoids mainnet claims. Next steps:

- Add an Arc Testnet settlement worker.
- Add transaction examples from ArcScan.
- Add Circle Gateway funding flow notes.
- Add Wallets or compatible wallet management examples.
- Add CCTP funding path documentation.
- Evaluate Nanopayments or x402-style authorization for sub-cent usage.

## Why This Is Useful

The prototype gives Arc builders a concrete pattern for paid APIs, paid data access, usage-based AI services, and agent-to-agent commerce.

It is intentionally narrow: a working reference implementation is more valuable at this stage than a broad product claim.
