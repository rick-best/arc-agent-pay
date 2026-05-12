# ArcAgent Pay Architecture

## Goal

Enable AI agents to pay for APIs, data, and services with small USDC-denominated payment intents that can later be settled on Arc.

## Flow

1. Merchant publishes a service ID, accepted chain, price, and policy.
2. Agent signs a payment intent containing merchant, payer, amount, service ID, nonce, and expiry.
3. Merchant verifies the signed intent before serving the request.
4. Merchant records fulfilled usage.
5. Settlement worker batches fulfilled requests.
6. Batch status moves through created, submitted, confirmed, or failed.
7. Dashboard snapshot shows usage, revenue, signal receipts, settlement state, and transaction references.

## Why signed intents

Signed intents make request-level payment authorization cheap and fast. They let the merchant validate that an agent agreed to pay before serving a request, without forcing each request into a separate onchain transaction.

## Settlement

The first prototype models settlement batches and status transitions without custodying funds or requiring a private key. Demo transaction references are deterministic placeholders. The next milestone is a live Arc Testnet executor using an approved wallet flow and official Arc RPC/explorer references.

## Receipts and dashboard

The Agora demo creates a signed reasoning receipt for each market signal. The receipt stores a deterministic artifact hash, signer, chain ID, expiry, and metadata. The dashboard snapshot aggregates fulfilled requests and settlement batches into revenue, pending/submitted/confirmed/failed totals, and per-signal rows.

## Risk controls

- Expiry timestamps.
- Nonce tracking.
- Merchant and service binding.
- Spending limits.
- Testnet-only settlement at first.
- Clear transaction-status reporting.
