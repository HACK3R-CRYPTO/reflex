# Reflex

> *"The chain reacts. You play."*

Reflex is a real-time on-chain gaming platform built natively on **Somnia Reactivity**. Every match result, score, and leaderboard change is pushed to your screen the instant it happens on-chain — no polling, no refresh.

## Platform

- 🎮 **Solo Games** — Rhythm & Memory games to earn RFX tokens
- ⚔️ **PvP Arena** — Wager RFX against humans or the NEXUS AI (Nash Equilibrium, always fair)
- 🤖 **Bot Registry** — Community bots compete via EIP-8004 agent identities
- 🏆 **Live Leaderboard** — Unified rankings updated atomically by Somnia validators via on-chain reactivity

## How Reactivity Works

`ArenaPlatform` emits a `MatchCompleted` event on every match.
Somnia validators detect it and automatically call `ReactiveLeaderboard.onEvent()` — no off-chain servers, no polling.

```
ArenaPlatform → MatchCompleted event
    ↓ (Somnia validators at 0x0100)
ReactiveLeaderboard.onEvent()  ← updates stats atomically on-chain
```

`ReactiveLeaderboard` inherits `SomniaEventHandler` from `@somnia-chain/reactivity-contracts`. The handler is registered via a Solidity subscription on the Somnia Reactivity Precompile.

## Fairness

All PvP uses on-chain **commit-reveal** — neither player can see the other's move before committing. The official AI (NEXUS) uses Nash Equilibrium — mathematically 50/50, always.

## Tech Stack

| Layer | Technology |
|---|---|
| Chain | Somnia Testnet (Chain ID: 50312) |
| Contracts | Foundry · Solidity `^0.8.19` |
| Reactivity | `@somnia-chain/reactivity-contracts` · `SomniaEventHandler` |
| Agent (NEXUS) | Node.js / TypeScript / ethers.js |
| Frontend | Next.js / TypeScript |

## Deployed Contracts (Somnia Testnet)

| Contract | Address |
|---|---|
| ReflexToken (RFX) | `0x2ef34c1CbBA918a7553e1c37f694a2De5332fF91` |
| ReflexPass (NFT) | `0x949Bc496528aBBd3a48Ab11B3a092C2a54b16360` |
| ReflexSwap | `0x42a53C3Ce6cBf795ba5252b9817FE58f4c984365` |
| ArenaPlatform | `0xABa92335453d8c97c5A550827dffa0E95977384F` |
| AgentRegistry | `0x1620024163b8C9CE917b82932093A6De22Ba89d8` |
| ReactiveLeaderboard | `0x8BA994E22f9Ec33d0C0dD069939B8f52658980E0` |

Reactivity subscription TX: [`0x3e8c77e...aaa34`](https://shannon-explorer.somnia.network/tx/0x3e8c77e78ea4067cb615ee29fd0c13c13aa2872cb8982ee46e6032379b8aaa34)

## Setup

```bash
# 1. Contracts
cd contracts && forge install && forge test

# 2. Agent (NEXUS bot)
cd agent && npm install && cp .env.example .env
# Fill in your private key in .env
npm start

# 3. Register on-chain reactivity subscription (run once after deploy)
npm run subscribe

# 4. Frontend
cd frontend && npm install && npm run dev
```

## Community Bots

Anyone can deploy a bot to compete in the Reflex arena. See [`agent/BOT_STARTER_KIT.md`](./agent/BOT_STARTER_KIT.md).

---

Built for the Somnia Reactivity Mini Hackathon 2026.
