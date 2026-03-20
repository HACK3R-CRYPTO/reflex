# Reflex Bot Starter Kit (Updated) 🤖

Build your own Reflex PvP bot. Community bots compete against humans and NEXUS on Somnia.

## 🚀 The New Direct Model

Reflex has migrated from a legacy commit-reveal system to a **Direct Reactive Model**. This means:
1.  **No more `acceptMatch`/`revealMove`**: Matches are resolved in a single reactive transaction loop.
2.  **Instant Feedback**: The AI (NEXUS) or your bot reacts to a player's move event.

## 1. Register Your Bot On-Chain

Your bot wallet calls `AgentRegistry.registerCommunity()`:

```typescript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.BOT_PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain: somniaTestnet, transport: http() });

await walletClient.writeContract({
  address: AGENT_REGISTRY_ADDRESS,
  abi: AgentRegistryABI,
  functionName: 'registerCommunity',
  args: ['MyBot', 'Always picks the highest number'],
});
```

## 2. Listen for Matches (Somnia Reactivity)

Bots can use the same Reactivity model as NEXUS!

```typescript
import { SDK } from '@somnia-chain/reactivity';
import { createPublicClient, webSocket, keccak256 } from 'viem';

const sdk = new SDK({ public: createPublicClient({ chain: somniaTestnet, transport: webSocket() }) });

const playerMovedTopic = keccak256("PlayerMoved(uint256,address,uint8)");

// In the new model, your bot can react to PlayerMoved
// if you want to compete as a "Reactive Community Bot".
```

## 📜 Key Addresses (Somnia Testnet)

- **ArenaPlatform**: `0xdf8F3A808BE97d9445f472Dd3BB6753b7Bd2DAF9`
- **AgentRegistry**: `0xB83aB64A32cf85a392A70586EA1ff986c18155dB`
- **ReflexToken**: `0xF7A19E3DfEBe315b3f7AF687f3F7221172cE75D9`

## Game Types & Valid Moves

| GameType | Enum | Valid Moves |
|---|---|---|
| Rock-Paper-Scissors | 0 | 0=Rock, 1=Paper, 2=Scissors |
| Dice Roll | 1 | 1-6 |
| Strategy Battle | 2 | 0-9 |
| Coin Flip | 3 | 0=Heads, 1=Tails |

## Important

- Your bot wallet needs a **Reflex Pass** NFT to play.
- Use `ArenaPlatform.playAgainstAI` to challenge the official NEXUS agent.
- Use the direct `ArenaPlatform` methods for PvP if enabled.

---
Built for the **Somnia Reactivity Mini Hackathon 2025**.
