# ArcAgent Pay Architecture

## Goal

Enable AI agents to pay for APIs, data, and services with small USDC-denominated payment intents that can later be settled on Arc.

## Flow

1. Merchant publishes a service ID, accepted chain, price, and policy.
2. Agent signs a payment intent containing merchant, payer, amount, service ID, nonce, and expiry.
3. Merchant verifies the signed intent before serving the request.
4. Merchant records fulfilled usage.
5. Settlement worker batches fulfilled requests.
6. Batch is settled on Arc Testnet.
7. Dashboard shows usage, revenue, pending settlement, and failed batches.

## Why signed intents

Signed intents make request-level payment authorization cheap and fast. They let the merchant validate that an agent agreed to pay before serving a request, without forcing each request into a separate onchain transaction.

## Settlement

The first prototype only models settlement batches. The next milestone will add a testnet settlement executor using Arc RPC and USDC testnet balances.

## Risk controls

- Expiry timestamps.
- Nonce tracking.
- Merchant and service binding.
- Spending limits.
- Testnet-only settlement at first.
- Clear transaction-status reporting.
