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

This is a prototype scaffold. The first implementation focuses on payment-intent creation and merchant-side verification. Settlement execution is intentionally isolated so the project can start safely on Arc Testnet.

## Repository layout

```text
src/
  intent.ts        Payment-intent creation and validation helpers
  merchant.ts      Merchant-side request verification
  settlement.ts    Settlement batch model and status tracking
  types.ts         Shared types
examples/
  demo.ts          End-to-end local demo
docs/
  architecture.md  Product and technical architecture
  grant.md         Grant submission summary
test/
  intent.test.ts   Payment-intent unit tests
```

## Development

```bash
npm install
npm run build
npm test
npm run demo
```

## Milestones

1. Payment-intent prototype.
2. Arc Testnet settlement worker.
3. Merchant dashboard.
4. Public demo, documentation, and Arc House technical post.

## Grant request

Proposed request: 10,000 USDC, milestone-based.

## Disclaimer

This is experimental software for testnet development. It is not a regulated financial product, custody product, or investment product.
