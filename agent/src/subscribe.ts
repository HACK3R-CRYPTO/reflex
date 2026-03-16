/**
 * subscribe.ts
 *
 * Run this AFTER deploying contracts to register the on-chain Somnia Reactivity
 * subscription. This subscribes the ReactiveLeaderboard to MatchCompleted events
 * from ArenaPlatform, so validators automatically invoke the leaderboard handler.
 *
 * Usage:
 *   npx ts-node src/subscribe.ts
 *
 * Required env vars:
 *   SOMNIA_RPC_URL, DEPLOYER_PRIVATE_KEY (or AGENT_PRIVATE_KEY),
 *   ARENA_PLATFORM_ADDRESS, REACTIVE_LEADERBOARD_ADDRESS
 */

import { SDK } from "@somnia-chain/reactivity";
import { createPublicClient, createWalletClient, http, parseGwei, defineChain, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
dotenv.config();

const somniaTestnet = defineChain({
    id: 50312,
    name: "Somnia Testnet",
    nativeCurrency: { decimals: 18, name: "STT", symbol: "STT" },
    rpcUrls: {
        default: { http: [process.env.SOMNIA_RPC_URL ?? "https://dream-rpc.somnia.network"] },
        public:  { http: [process.env.SOMNIA_RPC_URL ?? "https://dream-rpc.somnia.network"] },
    },
});

async function main() {
    const rpcUrl     = process.env.SOMNIA_RPC_URL;
    const privateKey = (process.env.DEPLOYER_PRIVATE_KEY ?? process.env.AGENT_PRIVATE_KEY) as `0x${string}`;
    const arenaAddr  = process.env.ARENA_PLATFORM_ADDRESS as `0x${string}`;
    const lbAddr     = process.env.REACTIVE_LEADERBOARD_ADDRESS as `0x${string}`;

    if (!rpcUrl || !privateKey || !arenaAddr || !lbAddr) {
        console.error("❌ Missing env: SOMNIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ARENA_PLATFORM_ADDRESS, REACTIVE_LEADERBOARD_ADDRESS");
        process.exit(1);
    }

    const account = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });
    const walletClient = createWalletClient({ account, chain: somniaTestnet, transport: http() });

    // The SDK types require public client without account — cast to satisfy the type
    const sdk = new SDK({ public: publicClient as any, wallet: walletClient as any });

    // MatchCompleted(uint256 indexed matchId, address challenger, address opponent, address winner, uint256 prize)
    const matchCompletedTopic = keccak256(toHex("MatchCompleted(uint256,address,address,address,uint256)"));

    console.log("📡 Registering on-chain Somnia Reactivity subscription...");
    console.log(`   Arena:       ${arenaAddr}`);
    console.log(`   Leaderboard: ${lbAddr}`);
    console.log(`   Topic:       ${matchCompletedTopic}`);

    const txHash = await sdk.createSoliditySubscription({
        emitter: arenaAddr,               // Only events from our ArenaPlatform
        eventTopics: [matchCompletedTopic], // Only MatchCompleted
        handlerContractAddress: lbAddr,   // ReactiveLeaderboard will handle them
        // Gas — "medium" tier for cross-contract state writes
        priorityFeePerGas: parseGwei("0"),
        maxFeePerGas: parseGwei("10"),
        gasLimit: 3_000_000n,
        isGuaranteed: true,   // retry if block full
        isCoalesced: false,   // one call per match
    });

    if (txHash instanceof Error) {
        console.error("❌ Subscription failed:", txHash.message);
        process.exit(1);
    }

    console.log(`\n✅ Reactivity subscription created!`);
    console.log(`   TX: ${txHash}`);
    console.log(`\nWhenever ArenaPlatform emits MatchCompleted, validators will automatically`);
    console.log(`invoke ReactiveLeaderboard.onEvent() to update leaderboard stats on-chain.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
