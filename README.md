# Reflex: Native Reactive AI Arena on Somnia

Reflex is a decentralized gaming platform on Somnia that introduces **NEXUS**, a truly native, on-chain AI agent. By leveraging Somnia's Native Reactivity, Reflex eliminates the need for off-chain oracles or complex commit-reveal schemes, enabling sub-second, provably fair gameplay.

## 🚀 Hackathon Submission Highlights

- **Native Reactivity**: The NEXUS AI agent is implemented as a smart contract that reacts instantly to player moves via Somnia's high-performance event bus.
- **On-Chain Fairness**: Every move is governed by on-chain randomness (`block.prevrandao`) and explicit fairness rules.
- **Premium UX**: A sleek, high-fidelity frontend that demonstrates the power of sub-second finality on Somnia.

## 🛠 Project Structure

- `contracts/`: Solidity smart contracts using `@somnia-chain/reactivity-contracts`.
- `frontend/`: Next.js application built with Viem and Wagmi.
- `prd.md`: Comprehensive Project Requirements Document.

## 📜 Deployed Contracts (Somnia Testnet)

| Contract | Address |
| --- | --- |
| **ArenaPlatform** | `0x4f4b7659b709f2470dee6a4afafc3eaf995074d4` |
| **ReflexToken (RFX)** | `0x235a7a9e52069286981d2e6848593bc2ce64b291` |
| **AgentRegistry** | `0x1faad51426d876a07544f8d3290042971f435276` |
| **ReflexPass (NFT)** | `0x4583187e8f166159a0a438d60f0b8be5a0fd901a` |
| **ReactiveLeaderboard**| `0x2dfffd643df2545e1f195a0d77b9cc6c9ef672ed` |
| **ReactiveHandler** | `0xa9b7b9cf9d9d1f3d128f2b29c0e9513053f6515f` |

**Somnia Subscription ID**: `21148` (Verified Sub-Second Resolution)

## ⚖️ Fairness Mechanics

Reflex ensures a fun and mathematically fair experience through three core rules:

1.  **True Probabilities**: AI moves are determined by `block.prevrandao`, ensuring exactly 1/n odds for every game type (RPS, Dice, etc.).
2.  **No "Future Sight"**: Because the AI reacts to the *event* of your move in a subsequent block-step, it is mathematically impossible for the AI to see your move and choose a counter-move in the same transaction.
3.  **Player Wins Ties**: In any draw scenario (e.g., both roll a 6), the human player automatically wins. This gives the user a permanent statistical edge over the NEXUS AI.

## 🏁 Quick Start

### Contracts
```bash
cd contracts
npm install
# Already deployed to Somnia Testnet!
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---
Built for the **Somnia Reactivity Mini Hackathon 2025**.
