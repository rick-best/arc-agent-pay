# ArcAgent Pay

ArcAgent Pay is an early-stage developer toolkit for AI-agent payments using USDC settlement on Arc.

The project explores a simple flow for agentic commerce:

1. An agent wants to call a paid API or tool.
2. The agent signs a small USDC payment intent.
3. The merchant verifies the intent before serving the request.
4. Fulfilled requests are batched for settlement on Arc.
5. The merchant dashboard tracks usage, pending settlement, and revenue.

This repository is being prepared as a Circle Developer Grants submission and Arc Testnet prototype.

## Why Arc

Arc is designed for stablecoin-native financial applications. Agentic payments need predictable fees, fast settlement, and a clean stablecoin UX. ArcAgent Pay uses Arc as the settlement network for tiny usage-based USDC payments.

## Circle integrations

Planned integrations:

- USDC as the payment asset.
- Arc Testnet as the first settlement environment.
- Circle Gateway for unified USDC funding and balance abstraction.
- Circle Nanopayments or x402-style payment authorization for sub-cent usage flows.
- Circle Wallets or compatible EVM wallets for agent and merchant accounts.
- CCTP for crosschain USDC funding where needed.

## Current status

This is a working testnet-oriented prototype. It includes signed payment-intent creation, merchant-side verification, nonce replay protection, signed reasoning receipts, settlement batch status tracking, and a dashboard snapshot for hackathon/demo output. Live Arc Testnet transaction execution remains isolated until a dedicated settlement contract or approved testnet wallet flow is added.

## Repository layout

```text
src/
  intent.ts        Payment-intent creation and validation helpers
  merchant.ts      Merchant-side request verification
  settlement.ts    Settlement batch model and status tracking
  receipt.ts       Deterministic reasoning receipts and signature checks
  dashboard.ts     Merchant dashboard snapshot model
  types.ts         Shared types
examples/
  demo.ts          End-to-end local demo
  agora-signal-receipts/
    demo.ts        Agora market-signal receipt demo
  agent-api-meter/
    demo.ts        Usage-based paid API calls for agent marketplaces
  escrow-judge/
    demo.ts        AI-reviewed deliverables and escrow release receipts
  reputation-router/
    demo.ts        Agent selection with signed reputation routing receipts
  policy-guard/
    demo.ts        Paid agent spend-policy decisions
  subscription-agent/
    demo.ts        Autonomous agent-service renewals
  liquidity-router/
    demo.ts        USDC funding route plans toward Arc settlement
docs/
  architecture.md  Product and technical architecture
  grant.md         Grant submission summary
  portfolio/       Arc demo portfolio notes
test/
  intent.test.ts   Payment-intent unit tests
```

## Development

```bash
npm install
npm run build
npm test
npm run demo
npm run demo:agora
npm run demo:portfolio
```

## Agora Agents Hackathon demo

The `examples/agora-signal-receipts` demo adapts the payment-intent flow into a hackathon-ready agentic market-intelligence product:

1. An AI signal agent produces a structured market signal.
2. The signal is hashed into a deterministic reasoning receipt.
3. The agent signs the receipt.
4. A buyer signs a small USDC payment intent on Arc Testnet.
5. The merchant verifies payment authorization and rejects replayed nonces.
6. Fulfilled access is grouped into a settlement batch with submitted status.
7. A dashboard snapshot shows revenue, settlement state, signal hash, and demo transaction reference.

This demo is for testnet development and product submission only. It does not execute trades, custody funds, or provide investment advice.

## Arc demo portfolio

The repository now contains a small portfolio of Arc-native agentic commerce demos:

- `Arc Signal Receipts`: paid market-intelligence artifacts with signed reasoning receipts.
- `Arc Agent API Meter`: usage-based paid API calls for agent marketplaces.
- `Arc Escrow Judge`: AI-reviewed deliverables that produce release/refund receipts for USDC escrow workflows.
- `Arc Reputation Router`: agent selection with signed reputation routing decisions and per-route settlement.
- `Arc Policy Guard`: paid allow/deny checks for autonomous agent spend policies.
- `Arc Subscription Agent`: recurring USDC renewals for agent services with entitlement receipts.
- `Arc Liquidity Router`: signed funding route plans for moving USDC liquidity toward Arc settlement.

All demos share the same primitives: signed USDC payment intents, merchant policy checks, nonce replay protection, signed receipts, settlement batches, and dashboard snapshots.

## Milestones

1. Payment-intent prototype.
2. Arc Testnet settlement worker.
3. Merchant dashboard.
4. Public demo, documentation, and Arc House technical post.

## Grant request

Proposed request: 10,000 USDC, milestone-based.

## Disclaimer

This is experimental software for testnet development. It is not a regulated financial product, custody product, or investment product.
