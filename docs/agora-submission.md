# Agora Agents Hackathon Submission Notes

Status: prepared, not submitted.

Official page checked: https://agora.thecanteenapp.com/

Official Arc X verification: @arc retweeted Canteen's Agora Agents Hackathon announcement on 2026-05-12.

## Project

Arc Signal Receipts

## Short description

Arc Signal Receipts is an AI market-intelligence agent that creates structured prediction-market signals, hashes each signal into a signed reasoning receipt, and uses USDC payment intents on Arc Testnet for pay-per-signal access.

## Why this fits Agora

Agora is focused on agents that trade, invest, create, and interface with markets, settled on Arc with USDC. Arc Signal Receipts turns market reasoning into a paid, verifiable product:

- The signal agent produces a structured market view.
- The reasoning output is hashed into a deterministic receipt.
- A buyer unlocks the signal with a small USDC payment intent.
- The merchant verifies payment authorization before returning the signal.
- Fulfilled access can be batched for Arc Testnet settlement.

## RFB fit

Primary fit:

- RFB 02: Prediction Market Trader Intelligence.

Secondary fit:

- RFB 06: Social Trading Intelligence.

## Current demo

Run locally:

```bash
npm install
npm run build
npm test
npm run demo:agora
```

The demo prints:

- payment verification result
- deterministic signal receipt hash
- signed receipt
- unlocked signal payload
- Arc Testnet settlement batch model

## Submission assets

- GitHub: https://github.com/rick-best/arc-agent-pay
- Demo folder: `examples/agora-signal-receipts`
- Main script: `examples/agora-signal-receipts/demo.ts`
- Walkthrough: `docs/demo-walkthrough.md`
- Grant/application deck: `docs/application-deck.md`

## 60 to 90 second pitch script

I am building Arc Signal Receipts, an AI market-intelligence agent for Agora. The problem is that AI agents can produce market views, but those views are hard to monetize, verify, and settle in small units. Most signals today are either free posts, subscriptions, or opaque trading bots.

Arc Signal Receipts makes each signal a paid, verifiable artifact. The agent creates a structured prediction-market signal with confidence, reasoning summary, sources, risk level, and expiry. The signal is hashed into a deterministic receipt and signed by the agent. A buyer unlocks the signal through a small USDC payment intent on Arc Testnet. The merchant verifies the payment before releasing the signal, and fulfilled access can be batched for settlement.

Arc is central because this workflow needs predictable USDC-denominated costs, fast finality, and stablecoin-native settlement. The current demo extends my ArcAgent Pay prototype and shows signed receipts, payment verification, and a settlement batch model. The next step is adding live Arc Testnet transactions, a small dashboard, and feedback from Arc House and Agora builders.

## Traction answer

This is an early hackathon build. Current progress includes a working TypeScript prototype, local demo, signed payment-intent verification, deterministic receipt hashing, settlement batch modeling, Arc Testnet wallet preparation, and public GitHub materials. Next traction goal is to collect feedback from Arc House, Canteen Discord, and Arc builder Discord during the event window.

## Safety note

The project does not custody user funds, execute trades, or provide investment advice. The current build is a testnet-only developer demo for agentic commerce and market-intelligence monetization.
