# Reflex — Contracts

Solidity contracts for the Reflex gaming platform. Built with Foundry, deployed on Somnia Testnet.

## Architecture

```
ReflexToken (RFX) ─────► ReflexSwap (buy RFX)
                          ReflexPass (mint with RFX)
                               │
                               ▼
                         ArenaPlatform ──► MatchCompleted event
                               │                  │
                               ▼                  ▼ (Somnia Reactivity)
                         AgentRegistry    ReactiveLeaderboard
                                          (SomniaEventHandler)
```

## Contracts

| Contract | Description | Address |
|---|---|---|
| `ReflexToken` | ERC-20 in-game currency (RFX). 100M supply, minted by ReflexSwap | `0x2ef34c1CbBA918a7553e1c37f694a2De5332fF91` |
| `ReflexPass` | ERC-721 access pass, costs 10 RFX to mint | `0x949Bc496528aBBd3a48Ab11B3a092C2a54b16360` |
| `ReflexSwap` | Swap STT → RFX at fixed rate (1 STT = 100 RFX) | `0x42a53C3Ce6cBf795ba5252b9817FE58f4c984365` |
| `ArenaPlatform` | PvP commit-reveal arena with wager support | `0xABa92335453d8c97c5A550827dffa0E95977384F` |
| `AgentRegistry` | EIP-8004 registry for AI agent identities | `0x1620024163b8C9CE917b82932093A6De22Ba89d8` |
| `ReactiveLeaderboard` | On-chain leaderboard updated via Somnia Reactivity | `0x8BA994E22f9Ec33d0C0dD069939B8f52658980E0` |

## On-Chain Reactivity (`ReactiveLeaderboard`)

`ReactiveLeaderboard` inherits [`SomniaEventHandler`](https://www.npmjs.com/package/@somnia-chain/reactivity-contracts).

When `ArenaPlatform` emits `MatchCompleted`, Somnia validators at `0x0100` automatically invoke `onEvent()`, which decodes the event data and updates player stats atomically — no off-chain agent needed.

```solidity
// Only the Somnia Reactivity Precompile (0x0100) can call this
function _onEvent(address emitter, bytes32[] calldata topics, bytes calldata data)
    internal override
{
    // decodes MatchCompleted payload → updates wins/losses/score
}
```

Reactivity subscription TX: `0x3e8c77e78ea4067cb615ee29fd0c13c13aa2872cb8982ee46e6032379b8aaa34`

## Setup

```bash
# Install dependencies
forge install

# Run tests (26 tests)
forge test

# Deploy to Somnia Testnet (set .env first)
cp .env.example .env
source .env && forge script script/Deploy.s.sol --rpc-url $SOMNIA_RPC_URL \
  --broadcast --legacy --slow --skip-simulation --gas-price 6000000000
```

## Environment Variables

```env
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
DEPLOYER_PRIVATE_KEY=0x...
```

## Dependencies

- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) v5 — `Ownable`, `ERC20`, `ERC721`
- [@somnia-chain/reactivity-contracts](https://www.npmjs.com/package/@somnia-chain/reactivity-contracts) — `SomniaEventHandler`
- [forge-std](https://github.com/foundry-rs/forge-std) — Foundry testing utilities
