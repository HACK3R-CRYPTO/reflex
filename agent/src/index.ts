import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Reflex Agent (NEXUS) starting...");

  const rpcUrl = process.env.SOMNIA_RPC_URL || "https://rpc-testnet.somnia.network";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.warn("⚠️ AGENT_PRIVATE_KEY not found in .env. Running in read-only mode.");
  } else {
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`📡 Connected as: ${wallet.address}`);
  }

  console.log("⏳ Waiting for Somnia Reactivity events...");
  
  // TODO: Initialize Reactivity SDK and subscribe to MatchProposed events
}

main().catch((error) => {
  console.error("💥 Fatal Error:", error);
  process.exit(1);
});
