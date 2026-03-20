# Reflex Smart Contracts 🛡️

This directory contains the core logic for the Reflex platform, built using **Foundry** and integrated with **Somnia Native Reactivity**.

## 🏗 Architecture: Reactive AI (NEXUS)

Unlike traditional dApps that rely on off-chain oracles or commit-reveal patterns, Reflex uses an **Event-Driven AI** model:
1.  **Direct Execution**: The player calls `playAgainstAI` on `ArenaPlatform`.
2.  **Native Push**: Somnia's validator layer captures the `PlayerMoved` event.
3.  **On-Chain Reaction**: The `ReactiveHandler` (via a Somnia Subscription) is automatically invoked in a subsequent block-step.
4.  **Blind Resolution**: The handler calls back into `ArenaPlatform` to resolve the match using `block.prevrandao` for fair randomness.

## 📜 Deployment Details (Somnia Testnet)

| Contract | Address |
| --- | --- |
| **ArenaPlatform** | `0x532A7277d6f72210Ab87a81d835481564d3F4357` |
| **ReflexToken (RFX)** | `0xF7A19E3DfEBe315b3f7AF687f3F7221172cE75D9` |
| **AgentRegistry** | `0xB83aB64A32cf85a392A70586EA1ff986c18155dB` |
| **ReflexPass** | `0xEA10f5325c7f3479c15B72281552Dee271059b4f` |
| **ReflexSwap** | `0x25ab836600959efC9F1a79df5604f10Cc3A1EDd4` |
| **ReactiveHandler** | `0xeFA42897E24372A4d11932F73ed090fE4D229aED` |
| **Leaderboard** | `0x5c30934F22e76B23246B320fffaff82986272068` |

**Somnia Subscription ID**: `20997`

## ⚖️ Fairness & Security

- **True Random**: Uses `block.prevrandao` for AI move generation.
- **Player Advantage**: Human players win all ties automatically.
- **Asynchronicity**: The cross-block reaction ensures the AI cannot front-run or see the player's move in the same state transition.

## 🛠 Developer Guide

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js (for Reactivity SDK scripts)

### Setup
```bash
npm install
forge build
```

### Test
```bash
forge test -vvv
```

### Reactivity Management
The `scripts/subscribe.js` script manages the connection between the Arena and the Handler:
```bash
node scripts/subscribe.js
```

---
Built for the **Somnia Reactivity Mini Hackathon 2025**.
