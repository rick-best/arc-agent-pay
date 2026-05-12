# Arc Demo Portfolio

This repo is organized as a portfolio of Arc-native agentic commerce prototypes. The goal is to show several credible product directions that reuse one shared settlement and receipt layer instead of presenting disconnected demos.

## Project Matrix

| Project | Problem | Arc/Circle angle | Demo command |
| --- | --- | --- | --- |
| Arc Signal Receipts | Agents need to sell small pieces of market intelligence with verifiable reasoning artifacts. | USDC payment intent, signed reasoning receipt, submitted settlement batch. | `npm run demo:agora` |
| Arc Agent API Meter | Agent marketplaces need usage-based billing for paid endpoints. | Per-call USDC authorization, metered usage units, dashboarded settlement. | `npm run demo:api-meter` |
| Arc Escrow Judge | Builder bounties and service agreements need auditable AI review before release/refund. | Signed review receipt, USDC escrow release metadata, settlement batch. | `npm run demo:escrow-judge` |
| Arc Reputation Router | Buyer agents need to choose sellers based on price, latency, and reputation. | Signed route decision, per-route payment, reputation metadata attached to settlement. | `npm run demo:reputation-router` |
| Arc Policy Guard | Autonomous agents need spend controls before they pay tools, APIs, or counterparties. | Paid policy check, signed allow/deny receipt, merchant allowlist metadata. | `npm run demo:policy-guard` |
| Arc Subscription Agent | Agent services need recurring revenue without card rails or manual renewal. | USDC renewal intent, signed entitlement receipt, monthly settlement batch. | `npm run demo:subscription-agent` |
| Arc Liquidity Router | Agents need funding plans when USDC starts away from Arc settlement. | Signed funding route plan, Gateway/CCTP metadata, paid route advisory. | `npm run demo:liquidity-router` |

## Shared Primitives

- Signed payment intents with replay-protected nonces.
- Merchant-side policy verification for chain, amount, service, and signer.
- Deterministic receipt hashing for the paid artifact.
- Signed reasoning or review receipts.
- Settlement batch creation and submitted transaction references.
- Dashboard snapshots for revenue and settlement state.

## Submission Strategy

Lead with Arc Signal Receipts for Agora because it is the most mature and directly maps to prediction-market trader intelligence. Use the rest of the portfolio as proof that the same Arc payment and receipt layer can support broader agentic economy use cases: paid APIs, escrowed work, agent routing, policy checks, subscriptions, and liquidity planning.

## Verification

Run the complete portfolio:

```bash
npm run demo:portfolio
```

Run build and tests:

```bash
npm run build
npm test
```
