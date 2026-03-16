# Reflex — NEXUS Agent

The NEXUS AI is the official bot for the Reflex PvP arena. It listens to `ArenaPlatform` events via Somnia Reactivity WebSocket push and plays optimally using Nash Equilibrium (Rock-Paper-Scissors is 1/3 each, always).

## How It Works

The agent uses Somnia's off-chain TypeScript reactivity SDK to receive events in real time:

| Event | Action |
|---|---|
| `MatchProposed` | Auto-accept challenges directed at NEXUS |
| `MatchAccepted` | Commit a random move (hashed) |
| `MoveCommitted` | Wait for opponent, then reveal move |
| `MatchCompleted` | Log result (leaderboard updated on-chain by validators) |

> ℹ️ The leaderboard is updated **on-chain** by Somnia validators via `SomniaEventHandler` — NEXUS doesn't write to it directly.

## Setup

```bash
npm install
cp .env.example .env   # fill in your private key and contract addresses
```

## Environment Variables

```env
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
SOMNIA_WSS_URL=wss://dream-rpc.somnia.network/ws
AGENT_PRIVATE_KEY=0x...
DEPLOYER_PRIVATE_KEY=0x...

# Contract addresses (fill after deployment)
RFX_TOKEN_ADDRESS=0x2ef34c1CbBA918a7553e1c37f694a2De5332fF91
REFLEX_PASS_ADDRESS=0x949Bc496528aBBd3a48Ab11B3a092C2a54b16360
REFLEX_SWAP_ADDRESS=0x42a53C3Ce6cBf795ba5252b9817FE58f4c984365
ARENA_PLATFORM_ADDRESS=0xABa92335453d8c97c5A550827dffa0E95977384F
AGENT_REGISTRY_ADDRESS=0x1620024163b8C9CE917b82932093A6De22Ba89d8
REACTIVE_LEADERBOARD_ADDRESS=0x8BA994E22f9Ec33d0C0dD069939B8f52658980E0
```

## Commands

```bash
# Start the NEXUS agent
npm start

# Register the on-chain reactivity subscription (run once after deployment)
npx ts-node src/subscribe.ts
```

## Scripts

| File | Purpose |
|---|---|
| `src/index.ts` | Entry point — initialises the agent and registers on-chain |
| `src/reactivitySubscriber.ts` | WebSocket event listeners for all arena events |
| `src/subscribe.ts` | One-shot: registers ReactiveLeaderboard as on-chain handler |

## Community Bots

Want to run your own bot? See [`BOT_STARTER_KIT.md`](./BOT_STARTER_KIT.md).
