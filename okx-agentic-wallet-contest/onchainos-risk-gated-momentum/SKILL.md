---
name: onchainos-risk-gated-momentum
description: Risk-gated Solana and X Layer trading workflow for OKX Agentic Wallet competitions. Use when the user asks to scan, rank, monitor, or trade eligible Solana/X Layer tokens with OnchainOS, especially for the Agentic Wallet Trading Contest. The skill uses OnchainOS as the primary data source and execution tool, enforces security and competition-rule guardrails, and produces observable trade decisions before any swap.
---

# OnchainOS Risk-Gated Momentum

This skill finds eligible Solana and X Layer token opportunities, rejects unsafe or non-qualifying trades, and only then prepares small, controlled swaps through OKX Agentic Wallet. It is designed for the OKX Agentic Wallet Trading Contest, but it must never promise profit or attempt to manipulate volume.

## Operating Principles

- Use OnchainOS as the primary source for market data, token analysis, security checks, portfolio state, quotes, and execution.
- Trade only on `solana` and `xlayer`.
- Exclude stablecoin-to-stablecoin, native-token, and wrapped-native-token pairs from competition scoring assumptions.
- Never wash trade, circular trade, self-trade, or hedge on external venues to manufacture PnL or volume.
- Default to read-only analysis until the user provides budget, source token, risk limits, and explicit execution approval.
- Prefer capital preservation over trade count. A skipped trade is a valid decision.
- Keep every decision auditable with the decision log template below.

## Required User Inputs

Before any execution, collect:

- `budget`: maximum total capital allocated to this strategy.
- `per_trade_cap`: maximum size per entry, normally 5-15% of budget.
- `source_token`: the token to spend, usually USDC.
- `max_daily_loss`: stop the strategy once realized plus estimated unrealized loss reaches this threshold.
- `max_open_positions`: default 2.
- `confirmation_mode`: `manual` by default. Use autonomous mode only if the user explicitly asks and wallet policy limits are configured.

If any input is missing, run only the read-only discovery and ranking workflow.

## Discovery Workflow

Run both chains independently, then merge candidates.

```bash
onchainos token hot-tokens --chain solana --ranking-type 4 --rank-by 15 --time-frame 2 --risk-filter true --stable-token-filter true --liquidity-min 50000 --volume-min 100000 --holders-min 300 --limit 30
onchainos token hot-tokens --chain xlayer --ranking-type 4 --rank-by 15 --time-frame 2 --risk-filter true --stable-token-filter true --liquidity-min 25000 --volume-min 50000 --holders-min 100 --limit 30
onchainos signal list --chain solana --wallet-type 1,3 --min-address-count 2 --min-liquidity-usd 50000 --limit 30
onchainos signal list --chain xlayer --wallet-type 1,3 --min-address-count 2 --min-liquidity-usd 25000 --limit 30
```

Keep candidates that appear in hot-token results, signal results, or both. Prefer candidates with:

- rising 1h/4h volume without a vertical one-candle blowoff,
- at least two smart-money or whale signals,
- adequate liquidity for the planned order size,
- no obvious stable/native/wrapped-native classification,
- enough holders and unique traders to reduce single-wallet control risk.

## Token Due Diligence

For every candidate, run:

```bash
onchainos token report --chain <chain> --address <token>
onchainos token top-trader --chain <chain> --address <token> --limit 20
onchainos token trades --chain <chain> --address <token> --limit 100
onchainos market kline --chain <chain> --address <token> --bar 5m --limit 120
onchainos security token-scan --tokens "<chain_id>:<token>"
```

Reject immediately if any condition is true:

- security scan returns a block-level risk,
- honeypot, freeze, mint, blacklist, or transfer-tax risk is present and not clearly explained as benign,
- liquidity is below 20x the planned trade size,
- top holders, developer wallets, suspicious wallets, or bundled wallets dominate supply,
- recent trades show one-sided insider exit, coordinated sniping, or repeated suspicious-wallet selling,
- price is up more than 80% in the last hour without matching liquidity and holder growth,
- the token cannot be quoted by `onchainos swap quote`,
- the trade would be a non-counting stable/native/wrapped-native pair under contest rules.

## Scoring Model

Assign each candidate a 0-100 score:

- Momentum quality: 25 points
- Liquidity and executable depth: 20 points
- Smart-money or whale confirmation: 15 points
- Holder distribution and anti-rug profile: 15 points
- Chart structure and pullback quality: 10 points
- Social/search trend without obvious spam: 5 points
- Portfolio fit and correlation with open positions: 10 points

Only prepare a trade when:

- total score is at least 72,
- no hard reject fired,
- expected slippage is within limits,
- daily and per-position risk limits remain available.

## Quote And Pre-Trade Checks

Always quote before execution:

```bash
onchainos swap quote --chain <chain> --from <source_token> --to <target_token> --readable-amount <amount>
```

Before asking for execution approval, show:

- chain,
- token name and address,
- amount and source token,
- quote output summary,
- estimated slippage route,
- main positive signals,
- main risks,
- invalidation level or exit condition,
- whether the trade appears competition-eligible.

Do not execute if the user has not approved this exact trade.

## Execution

Use the Agentic Wallet address for the target chain.

```bash
onchainos wallet addresses
onchainos swap execute --chain <chain> --from <source_token> --to <target_token> --readable-amount <amount> --wallet <wallet_address> --max-auto-slippage <max_slippage> --mev-protection
```

Rules:

- Start with small entries. Default first entry is 25-40% of `per_trade_cap`.
- Use `--mev-protection` when supported and especially for Solana or high-volatility trades.
- Never use `--force` on the first execution attempt.
- If OnchainOS returns a warning or confirmation response, display it to the user and wait for explicit confirmation before retrying with the instructed flag.
- Never approve unlimited token allowances. If approval is required, cap approval to the required amount plus a small buffer.

## Position Management

After entry, monitor with:

```bash
onchainos market portfolio-overview --chain <chain> --address <wallet_address> --time-frame 1
onchainos market portfolio-token-pnl --chain <chain> --address <wallet_address> --token <target_token>
onchainos market kline --chain <chain> --address <target_token> --bar 5m --limit 120
onchainos token trades --chain <chain> --address <target_token> --limit 100
```

Exit or reduce when any condition is true:

- security status worsens,
- liquidity drops below 10x position size,
- suspicious wallets begin sustained selling,
- price closes below the planned invalidation level,
- realized plus unrealized strategy loss reaches `max_daily_loss`,
- the position reaches a planned take-profit level and momentum weakens.

Default exit plan:

- take 30-50% profit on the first strong move,
- trail the remainder with a structure-based stop,
- avoid round-trip churn solely to create volume.

## Competition Compliance

Before each proposed trade, state whether it is expected to count for the contest:

- chain must be Solana or X Layer,
- trade must be through Agentic Wallet,
- trade must be during the competition period,
- pair must not be only stablecoin, native token, or wrapped native token conversion,
- activity must not be wash trading, circular trading, external hedging, coordinated manipulation, or multi-wallet circumvention.

If compliance is uncertain, do not count the trade toward contest goals in the user's summary.

## Observability

For every scan cycle, produce this compact log:

```text
cycle_time:
wallet:
budget_remaining:
chain_focus:
candidates_scanned:
rejected_count:
top_candidates:
  - token:
    chain:
    score:
    positives:
    risks:
    next_action: skip | watch | quote | execute_after_approval
open_positions:
  - token:
    chain:
    entry_reason:
    pnl_status:
    exit_condition:
rule_flags:
  security:
  competition_eligibility:
  daily_loss:
```

## User-Facing Summary Format

When presenting a trade idea, use:

```text
Decision: WATCH / SKIP / ASK TO EXECUTE
Token:
Chain:
Score:
Why now:
Main risks:
Trade size:
Slippage cap:
Invalidation:
Contest eligibility:
Required confirmation:
```

## Failure Handling

- If any OnchainOS command fails, stop that candidate and report the failed command and error.
- If quotes are unavailable or stale, do not trade.
- If wallet balance is insufficient, do not suggest borrowing, leverage, or external hedging.
- If the user asks for guaranteed profit, volume farming, wash trading, or hidden-risk behavior, refuse and offer compliant alternatives.
