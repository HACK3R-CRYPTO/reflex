import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { setupReactivityListener } from "./reactivitySubscriber";
import { registerAgentIfNew } from "./agentRegistration";

dotenv.config();

// The NEXUS AI Agent
// Responsibilities:
// 1. Maintain a funded wallet on Somnia Testnet
// 2. Ensure it's registered on the AgentRegistry
// 3. Listen to Somnia Reactivity for MatchProposed events (auto-accepts open challenges)
// 4. Listen to Somnia Reactivity for MatchAccepted events (auto-plays its move)
async function main() {
    console.log("====================================");
    console.log("🤖 Reflex NEXUS Agent Initialization");
    console.log("====================================\n");

    const rpcUrl = process.env.SOMNIA_RPC_URL;
    const privateKey = process.env.AGENT_PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
        console.error("❌ Missing environment variables (SOMNIA_RPC_URL or AGENT_PRIVATE_KEY)");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`📡 Connected to Somnia Testnet`);
    console.log(`🛡️  Agent Address: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Native Balance: ${ethers.formatEther(balance)} SOMNI\n`);

    // 1. Register Agent Profile (Idempotent)
    await registerAgentIfNew(wallet);

    // 2. Subscribe to Reactivity Events
    console.log("🎧 Subscribing to Somnia Reactivity Engine...");
    setupReactivityListener(wallet);
}

main().catch((error) => {
    console.error("Fatal Error in NEXUS Agent:", error);
    process.exit(1);
});
