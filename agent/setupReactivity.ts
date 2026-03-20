/**
 * Post-Deployment: Create Somnia Reactivity on-chain subscription
 *
 * This script registers the ReactiveHandler contract to receive
 * ArenaPlatform events via Somnia's native reactivity precompile.
 *
 * Run AFTER deploying contracts:
 *   npx tsx setupReactivity.ts
 *
 * Requirements:
 *   - Deployer wallet must hold >= 32 STT (Somnia testnet tokens)
 *   - All contract addresses set in .env
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseGwei,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SDK } from '@somnia-chain/reactivity';
import { somniaTestnet } from './config.js';
import 'dotenv/config';

const account = privateKeyToAccount(process.env.NEXUS_PRIVATE_KEY as Hex);

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: somniaTestnet,
  transport: http(),
});

const sdk = new SDK({
  public: publicClient as any,
  wallet: walletClient as any,
});

const REACTIVE_HANDLER = process.env.REACTIVE_HANDLER_ADDRESS as `0x${string}`;
const ARENA_PLATFORM = process.env.ARENA_PLATFORM_ADDRESS as `0x${string}`;

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Setting up Somnia Reactivity');
  console.log('═══════════════════════════════════════');
  console.log(`Owner: ${account.address}`);
  console.log(`Handler: ${REACTIVE_HANDLER}`);

  // Create on-chain subscription for ReactiveHandler
  // This tells Somnia validators to invoke our handler when ArenaPlatform emits events
  const txHash = await sdk.createSoliditySubscription({
    handlerContractAddress: REACTIVE_HANDLER,
    emitter: ARENA_PLATFORM,  // Listen to ArenaPlatform events
    priorityFeePerGas: parseGwei('2'),
    maxFeePerGas: parseGwei('10'),
    gasLimit: 2_000_000n,
    isGuaranteed: true,   // Retry if block is full
    isCoalesced: false,    // One invocation per event
  });

  console.log(`\n✅ Reactivity subscription created!`);
  console.log(`   TX: ${txHash}`);
  console.log(`\n   ReactiveHandler will now receive events from validators.`);
}

main().catch(console.error);
