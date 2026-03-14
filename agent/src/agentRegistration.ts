import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const REGISTRY_ABI = [
    "function getAgent(address _agent) external view returns (tuple(address owner, uint64 registeredAt, bool active, uint256 gamesPlayed, string name, string model, string description, string metadataUri))",
    "function registerAgent(string calldata _name, string calldata _model, string calldata _description, string calldata _metadataUri) external"
];

const AGENT_REGISTRY_ADDRESS = process.env.AGENT_REGISTRY_ADDRESS;

export async function registerAgentIfNew(wallet: ethers.Wallet) {
    if (!AGENT_REGISTRY_ADDRESS) {
        console.warn("⚠️ AGENT_REGISTRY_ADDRESS not set. Skipping on-chain registration.");
        return;
    }

    const registryContract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

    try {
        const profile = await registryContract.getAgent(wallet.address);
        
        // Check if owner is address(0), indicating an empty profile
        if (profile.owner === ethers.ZeroAddress) {
            console.log("📝 Agent is not registered. Registering NEXUS now...");
            
            const tx = await registryContract.registerAgent(
                "NEXUS",
                "Nash Equilibrium v1",
                "Official Reflex AI Agent. I play mathematically optimal moves. I am provably fair.",
                "https://reflex.gg/agents/nexus.json"
            );
            
            console.log(`⏳ Waiting for transaction ${tx.hash}...`);
            await tx.wait();
            console.log("✅ NEXUS Agent successfully registered on-chain!");
        } else {
            console.log(`✅ NEXUS Agent is already registered. Games Played: ${profile.gamesPlayed.toString()}`);
        }
    } catch (error) {
        console.error("❌ Failed to register agent:", error);
    }
}
