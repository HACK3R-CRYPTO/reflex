# Reflex — Product Requirements Document

> **Hackathon**: Somnia Reactivity Mini Hackathon  
> **Chain**: Somnia Testnet  
> **Deadline**: March 20, 2026  

---

## 1. What Is Reflex?

Reflex is a **real-time on-chain gaming platform** where every event — a score, a match result, a rank change — is pushed to your screen the instant it happens on-chain. No refresh. No waiting. The chain reacts so you don't have to.

It's built natively for Somnia's Reactivity layer. Not as a bolted-on feature — the entire product flow exists *because* chain events push in real-time.

> **Tagline**: *"The chain reacts. You play."*

---

## 2. The Problem

On-chain games today feel dead:
- Players refresh pages to see if their match resolved
- Results take seconds or minutes to appear
- Frontrunning lets opponents read your move before committing theirs
- Multiple tokens, multiple flows, multiple UX breaks

Reflex solves all of this in one platform with one economy.

---

## 3. One Flow. One Token. Two Ways To Play.

Every player goes through the same journey:

```
Connect Wallet
      │
      ▼
Swap SOMNI → RFX (Reflex Token)
      │
      ▼
Mint a Reflex Pass (NFT) — your platform key
      │
      ├──────────────────┬──────────────────────┐
      ▼                  ▼                       ▼
  Solo Games         PvP Arena             Leaderboard
  (earn RFX)         (wager RFX)           (unified ranks)
  Rhythm Game        vs Nash AI
  Simon Memory       vs Human
                     vs Community Bot
      │                  │                       │
      └──────────────────┴───────────────────────┘
                         │
                         ▼
              All events pushed via
              Somnia Reactivity → your screen
```

**RFX is the only token.** Solo games are how you grind it. PvP is how you multiply (or lose) it. One leaderboard ranks everyone — solo scores and PvP wins both count.

---

## 4. RFX Token Economy

| Action | RFX Flow |
|---|---|
| Swap SOMNI → RFX | Entry point for new players |
| Mint Reflex Pass | Costs RFX (one-time, unlocks everything) |
| Win a solo round | Earn RFX from rewards pool |
| Win a PvP match | Win 96% of the pot |
| Lose a PvP match | Lose your wager |
| Platform fee | 2% burned, 2% treasury |

The loop: **Earn in solo → risk in PvP → climb the leaderboard.**  
The Reflex Pass NFT is tradeable — good players can also earn by selling access.

---

## 5. Games

### Solo (Earn RFX)

| Game | How It Works | Scoring |
|---|---|---|
| **Rhythm** | Tap buttons in sync with beats | Points × combo multiplier (up to 50x) |
| **Memory** | Repeat flashing sequences | Points per sequence length × speed |

Solo scores submit directly to the leaderboard via Reactivity — rank updates the moment your score lands.

### PvP (Wager RFX)

All PvP uses **Native Reactive AI** — every match is instantly resolved fully on-chain within a few blocks. No commit-reveal waiting, no human griefing.

| Game | Win Condition |
|---|---|
| **Rock-Paper-Scissors** | Classic rules |
| **Dice Roll** | Higher number wins |
| **Strategy Battle** | Pick 0–9; higher wins |
| **Coin Flip** | Correctly predict the outcome |

---

### Native Reactive AI (NEXUS)
Reflex ships with an integrated native AI. To ensure the Official AI Agent does not always win and that the game is fun and provably fair, we enforce three strict rules:

1. **True Probabilities**: The AI's moves are constrained by exact mathematical models (e.g., exactly a 50% chance in Coin Flip, or exactly a 1/6 chance per number in Dice).
2. **No "Future Sight"**: Because the AI reads `prevrandao` inside the `_onEvent` triggered by the Relayer *after* your move is recorded, it mathematically cannot read your move and "choose" the winning counter-move. It is blind randomness combined with pattern probability.
3. **Universal "Player Wins Ties" Rule**: Adopted from the GameArena model, if a match results in a tie (same RPS move, same Dice roll, or both guess the coin correctly), the Human Player automatically wins. This gives the human challenger a permanent statistical advantage over the AI!

### Community Bots (optional, labeled)
Any developer can register a bot wallet and have it compete. Each bot profile shows its strategy. Players choose to challenge them knowing the risk.

---

## 7. Somnia Reactivity — How It Powers Everything

```
[ArenaPlatform.sol]
       │ emits MatchCompleted
       ▼
[ReactiveLeaderboard.sol]    ← on-chain reactive subscriber
       │ updates rankings in same block
       │ emits LeaderboardUpdated
       ▼
[Reactivity WebSocket]       ← Somnia native push, no polling
       │
       ├──→ Frontend: leaderboard rows animate live
       ├──→ Frontend: match feed updates instantly
       └──→ NEXUS agent: receives MatchAccepted → plays move
```

| Event | Who Gets It | Effect |
|---|---|---|
| `MatchProposed` | Frontend + bots | Live feed updates; bots auto-accept |
| `MatchAccepted` | NEXUS agent | Plays move within ~1 second |
| `MovePlayed` | Frontend (match page) | Move status animates |
| `MatchCompleted` | `ReactiveLeaderboard.sol` | Rankings update on-chain atomically |
| `LeaderboardUpdated` | Frontend | Leaderboard rows animate, no refresh |
| Solo score submitted | Frontend | Rank updates instantly on leaderboard |

**Zero polling. The chain pushes. The UI reacts.**

---

## 8. Architecture

```
/Reflex
├── contracts/               # Foundry — Somnia Testnet
│   ├── ArenaPlatform.sol    # Reactive AI Match engine, wager escrow
│   ├── AgentRegistry.sol    # On-chain bot identity (NEXUS + community bots)
│   ├── ReactiveLeaderboard.sol  # Somnia Reactivity subscriber, on-chain rankings
│   ├── ReflexToken.sol      # RFX ERC-20 token
│   ├── ReflexPass.sol       # NFT platform key (ERC-721)
│   └── ReflexSwap.sol       # SOMNI → RFX swap
│
├── agent/                   # Node.js / TypeScript
│   ├── scoreValidator.ts    # Anti-cheat for solo game score submissions
│   ├── scoreValidator.ts    # Anti-cheat for solo game score submissions
│   └── BOT_STARTER_KIT.md  # Community bot documentation + template
│
└── frontend/                # Next.js / TypeScript
    ├── /             # Landing + live platform stats
    ├── /play         # Game selector (solo + PvP in one place)
    ├── /play/rhythm  # Rhythm game
    ├── /play/memory  # Memory game
    ├── /arena        # PvP lobby + open challenges
    ├── /arena/[id]   # Live match — Reactivity-powered move status
    ├── /leaderboard  # Unified rankings (live, animated)
    └── /bots         # Bot registry explorer
```

---

## 9. Smart Contracts

| Contract | Purpose |
|---|---|
| `ArenaPlatform.sol` | Reactive AI PvP, wager escrow, match lifecycle |
| `AgentRegistry.sol` | On-chain bot identity (name, strategy, stats) |
| `ReactiveLeaderboard.sol` | Reactivity subscriber — updates rankings on-chain |
| `ReflexToken.sol` | RFX ERC-20 — the single platform token |
| `ReflexPass.sol` | ERC-721 NFT — platform access key |
| `ReflexSwap.sol` | SOMNI → RFX swap for onboarding |

---

## 10. 5-Day Build Plan

| Day | Focus |
|---|---|
| **1** | Deploy all contracts on Somnia testnet |
| **2** | Native AI logic in ArenaPlatform + Reactivity Subscriptions + anti-cheat validator |
| **3** | Frontend: onboarding flow, game modes, wallet + token integration |
| **4** | Reactivity UI: live match feed, animated leaderboard, match page |
| **5** | Polish, E2E test, demo video, README, submit |

---

## 11. Judging Criteria

| Criterion | How Reflex Addresses It |
|---|---|
| **Technical Excellence** | Full native on-chain AI, Reactivity subscriber contract, Prevrandao Math |
| **Real-Time UX** | Zero polling — every event Reactivity-pushed to frontend |
| **Somnia Integration** | All contracts on Somnia testnet, NEXUS bot on Somnia RPC |
| **Potential Impact** | Bot SDK enables community ecosystem; solo games attract non-crypto gamers |

---

## 12. Deployed Contracts

| Contract | Address |
|---|---|
| ReflexToken (RFX) | `TBD` |
| ReflexSwap | `TBD` |
| ReflexPass (NFT) | `TBD` |
| ArenaPlatform | `TBD` |
| AgentRegistry | `TBD` |
| ReactiveLeaderboard | `TBD` |