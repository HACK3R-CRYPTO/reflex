# Reflex Frontend 🎮

The official web interface for the Reflex Reactive AI Arena. Built with **Next.js**, **Viem**, and **Wagmi** for a smooth, sub-second gaming experience on Somnia.

## 🚀 Experience

Reflex is designed to showcase the power of **Somnia's 0.5s block times** and **Native Reactivity**. Gameplay feels instant and fluid, as the on-chain AI responds to your moves in real-time.

## 🛠 Tech Stack

- **Framework**: Next.js 15
- **Web3 Library**: Viem + Wagmi
- **Design**: Slick, dark-mode focused UI with Framer Motion animations.
- **Chain**: Somnia Shannon Testnet (Chain ID: 50312)

## 📡 Contract Integration

The frontend connects to the following contracts on Somnia Testnet:
- **ArenaPlatform**: `0xdf8F3A808BE97d9445f472Dd3BB6753b7Bd2DAF9`
- **ReflexToken**: `0xF7A19E3DfEBe315b3f7AF687f3F7221172cE75D9`
- **ReactiveHandler**: `0xeFA42897E24372A4d11932F73ed090fE4D229aED`

Addresses are managed in `src/lib/contracts.ts`.

## 🏁 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Create a `.env.local` (or update existing) with the contract addresses.

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Open in Browser**:
    Navigate to `http://localhost:3000`.

---
Built for the **Somnia Reactivity Mini Hackathon 2025**.
