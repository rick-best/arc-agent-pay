# ArcAgent Pay Application Deck

## 1. Project

ArcAgent Pay is a developer toolkit for AI-agent payments using USDC settlement on Arc.

The first product surface is a TypeScript SDK and demo API for pay-per-use agent tools. Agents create signed payment intents, merchants verify those intents before serving requests, and fulfilled requests are batched for settlement on Arc Testnet.

## 2. Problem

AI agents increasingly need to pay for APIs, data, compute, automation tools, and private services. Existing payment rails are not designed for autonomous software:

- Card billing assumes human account relationships.
- Prepaid credits create lock-in and reconciliation friction.
- One onchain transaction per request is too expensive and operationally noisy.
- API developers lack a simple way to verify usage-based payment authorization before serving a request.

This limits agentic commerce. Agents can call tools, but paying for tools in small, auditable, policy-controlled units is still hard.

## 3. Solution

ArcAgent Pay provides a focused payment stack:

- Agent SDK: creates signed USDC payment intents.
- Merchant SDK: verifies payment headers, expiry, nonces, and service binding.
- Settlement worker: batches fulfilled intents for Arc Testnet settlement.
- Dashboard: tracks pending settlement, fulfilled usage, failed requests, and revenue.
- Demo API: shows a paid API endpoint protected by payment-intent verification.

## 4. Why Arc

Arc is a strong fit because agentic payments need stablecoin-native execution, predictable fees, and fast settlement. ArcAgent Pay starts with Arc Testnet and USDC because the settlement asset, gas experience, and developer story are central to the product rather than optional add-ons.

## 5. Circle Integration

Current prototype:

- USDC as the intended settlement asset.
- Arc Testnet as the first settlement environment.
- Compatible EVM wallet signing for agent and merchant flows.

Planned integrations:

- Circle Gateway for unified USDC funding and balance abstraction.
- Circle Wallets or compatible wallets for agent and merchant wallet management.
- CCTP for bringing USDC liquidity into Arc from supported chains.
- Nanopayments or x402-style authorization for very small usage payments.

## 6. Current Status

Completed:

- Public GitHub repository.
- TypeScript implementation for payment-intent creation and canonical payloads.
- Merchant-side verification helpers.
- Replay and expiry checks.
- Signed reasoning receipt helpers.
- Settlement-batch model and status transitions.
- Dashboard snapshot output.
- Local tests and demo scripts.
- Arc House onboarding and Arc Testnet wallet funding.

Not claimed:

- No production users.
- No revenue.
- No AUM.
- No mainnet deployment.
- No live settlement transaction executor yet.

## 7. Milestones

Requested funding: 10,000 USDC, milestone-based.

Milestone 1: Testnet payment-intent prototype, 2,500 USDC

- Finalize signed payment-intent schema.
- Build sample agent and merchant flows.
- Verify payment headers.
- Publish technical README.

Milestone 2: Arc Testnet settlement worker, 3,000 USDC

- Batch valid payment intents.
- Add settlement status tracking.
- Publish transaction examples.

Milestone 3: Merchant dashboard and demo API, 2,500 USDC

- Build usage, pending settlement, failed request, and revenue views.
- Add history export.
- Connect dashboard to demo API.

Milestone 4: Developer docs and feedback, 2,000 USDC

- Publish SDK quickstart.
- Publish technical walkthrough.
- Draft one Arc House technical post.
- Recruit 3 to 5 builders for testnet feedback.

## 8. Ecosystem Impact

ArcAgent Pay can become a reusable reference implementation for paid APIs, paid data access, usage-based AI services, and machine-to-machine payments on Arc.

The project expands USDC utility by showing how autonomous software can buy and sell small units of service using stablecoin-native authorization and settlement.

## 9. Repository

GitHub: https://github.com/rick-best/arc-agent-pay

Local wallet used for Arc Testnet development: `0x7eEB8A9e794a30629B376203b97D11D9b7230De6`
