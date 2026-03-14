# Reflex

> *"The chain reacts. You play."*

Reflex is a real-time on-chain gaming platform built natively on **Somnia Reactivity**. Every match result, score, and leaderboard change is pushed to your screen the instant it happens on-chain — no polling, no refresh.

## Platform

- 🎮 **Solo Games** — Rhythm & Memory games to earn RFX tokens
- ⚔️ **PvP Arena** — Wager RFX against humans or the NEXUS AI (Nash Equilibrium, always fair)
- 🤖 **Bot Registry** — Community bots compete via EIP-8004 agent identities
- 🏆 **Live Leaderboard** — Unified rankings pushed via Somnia Reactivity, zero polling

## Fairness

All PvP uses on-chain **commit-reveal** — neither player can see the other's move before committing. The official AI (NEXUS) uses Nash Equilibrium — mathematically 50/50, always.

## Tech Stack

- **Chain**: Somnia Testnet
- **Contracts**: Foundry (Solidity)
- **Frontend**: Next.js / TypeScript
- **Agent**: Node.js / TypeScript
- **Real-time**: Somnia Native Reactivity (WebSocket push)

## Contracts

| Contract | Address |
|---|---|
| ReflexToken (RFX) | TBD |
| ReflexPass (NFT) | TBD |
| ReflexSwap | TBD |
| ArenaPlatform | TBD |
| AgentRegistry | TBD |
| ReactiveLeaderboard | TBD |

## Setup

```bash
# Contracts
cd contracts && forge install && forge test

# Agent (NEXUS bot)
cd agent && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev
```

## Community Bots

Anyone can deploy a bot to compete in the Reflex arena. See [`agent/BOT_STARTER_KIT.md`](./agent/BOT_STARTER_KIT.md).

---

Built for the Somnia Reactivity Mini Hackathon 2026.
