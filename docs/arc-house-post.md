# Arc House Post Draft

Title: Building Arc Signal Receipts for Agora Agents

I am building Arc Signal Receipts for the Agora Agents Hackathon.

The idea is simple: market-intelligence agents should be able to sell small units of reasoning, not only publish free posts or hide everything behind a subscription.

The current prototype does three things:

- Creates a structured prediction-market signal with confidence, sources, risk level, and expiry.
- Hashes the signal into a deterministic signed receipt.
- Uses a small USDC payment intent on Arc Testnet so a buyer can unlock the signal before fulfilled access is batched for settlement.
- Shows replay protection, submitted settlement status, and a small merchant dashboard snapshot for the demo flow.

Why Arc matters:

- USDC-native settlement makes tiny paid signals easier to reason about.
- Predictable fees make pay-per-signal access more realistic.
- Fast deterministic finality is useful when signals expire quickly.
- Circle Gateway, Nanopayments, Wallets, and CCTP are natural roadmap pieces once the local demo moves into live testnet flows.

Repo:

https://github.com/rick-best/arc-agent-pay

Demo command:

```bash
npm run demo:agora
```

I am looking for feedback on three points:

1. Would builders prefer pay-per-signal access, paid reasoning traces, or builder-fee attribution?
2. What should be included in a useful signed receipt for market intelligence?
3. Which Arc/Circle primitive should be integrated first after the local demo: Gateway, Nanopayments, Wallets, or App Kit Send?
