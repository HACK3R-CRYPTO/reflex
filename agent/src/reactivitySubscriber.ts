import { ethers } from "ethers";
import { generateOptimalMove, GameType } from "./nashStrategy";
import * as dotenv from "dotenv";

// Load env specific to the listener
dotenv.config();

const ARENA_PLATFORM_ADDRESS = process.env.ARENA_PLATFORM_ADDRESS;
const LEADERBOARD_ADDRESS = process.env.REACTIVE_LEADERBOARD_ADDRESS;

// Minimal ABI just for the events and functions we need
const ARENA_ABI = [
    // Events
    "event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)",
    "event MatchAccepted(uint256 indexed matchId, address indexed opponent)",
    "event MoveCommitted(uint256 indexed matchId, address indexed player)",
    "event MatchCompleted(uint256 indexed matchId, address challenger, address opponent, address winner, uint256 prize)",
    
    // Functions
    "function acceptMatch(uint256 _matchId) external",
    "function commitMove(uint256 _matchId, bytes32 _commitHash) external",
    "function revealMove(uint256 _matchId, uint8 _move, string calldata _secret) external",
    "function matches(uint256) external view returns (address challenger, uint8 gameType, uint8 status, address opponent, uint96 wager, address winner, uint64 createdAt)"
];

const LEADERBOARD_ABI = [
    "function recordMatchResult(address winner, address loser, address challenger, address opponent, uint256 prize, bool isTie) external"
];

// In-memory store of the moves we've committed so we know what to reveal
// Key: matchId => { move, secret }
const pendingReveals = new Map<number, { move: number, secret: string }>();

/**
 * Initializes the WebSocket listener for Somnia Network events.
 * This replaces standard polling with instant push reactivity.
 */
export function setupReactivityListener(wallet: ethers.Wallet) {
    if (!ARENA_PLATFORM_ADDRESS || !LEADERBOARD_ADDRESS) {
        console.error("❌ ARENA_PLATFORM_ADDRESS or REACTIVE_LEADERBOARD_ADDRESS not set. Cannot listen/update results.");
        return;
    }

    // Connect via WebSocket for Reactivity
    // Fallback to JSON RPC polling if WSS is not available in env
    const wsUrl = process.env.SOMNIA_WSS_URL;
    let provider: ethers.Provider;
    
    if (wsUrl) {
        provider = new ethers.WebSocketProvider(wsUrl);
        console.log("🔌 Connected to Somnia Reactivity Engine via WebSocket");
    } else {
        provider = wallet.provider;
        console.log("⚠️ No SOMNIA_WSS_URL found. Falling back to HTTP Polling (Warning: Non-Reactive)");
    }

    const arenaContract = new ethers.Contract(ARENA_PLATFORM_ADDRESS, ARENA_ABI, wallet.connect(provider));
    const leaderboardContract = new ethers.Contract(LEADERBOARD_ADDRESS, LEADERBOARD_ABI, wallet.connect(provider));

    // ------------------------------------------------------------------------
    // Reactivity Event 1: MatchProposed
    // Action: Auto-accept the match if it's an open challenge or directed at us
    // ------------------------------------------------------------------------
    arenaContract.on("MatchProposed", async (matchId, challenger, opponent, wager, gameType, event) => {
        // Ignore if we are the challenger (don't play ourselves)
        if (challenger === wallet.address) return;

        // Auto-accept open challenges (address(0)) or challenges directed at NEXUS specifically
        if (opponent === ethers.ZeroAddress || opponent === wallet.address) {
            console.log(`\n🔔 [REACTIVITY PUSH] Match ${matchId} proposed by ${challenger}. Auto-accepting...`);
            try {
                // Ensure we have enough tokens before accepting (wager approval assumed set elsewhere)
                const tx = await arenaContract.acceptMatch(matchId);
                console.log(`⏱️  Match ${matchId} accepted in tx: ${tx.hash}`);
            } catch (error: any) {
                console.error(`❌ Failed to accept match ${matchId}:`, error.reason || error.message);
            }
        }
    });

    // ------------------------------------------------------------------------
    // Reactivity Event 2: MatchAccepted
    // Action: We (NEXUS) accepted it, OR someone else accepted our open challenge.
    // Result: Instantly calculate Nash strategy and commit move on-chain
    // ------------------------------------------------------------------------
    arenaContract.on("MatchAccepted", async (matchId, opponent, event) => {
        try {
            // Fetch match details to know the GameType
            const matchData = await arenaContract.matches(matchId);
            const challenger = matchData.challenger;
            
            // Only act if we are involved in this match
            if (challenger !== wallet.address && opponent !== wallet.address) return;

            console.log(`\n🔥 [REACTIVITY PUSH] Match ${matchId} is ON! Calculating Nash strategy for GameType ${matchData.gameType}...`);

            // Generate optimal move
            const { move, secret, commitHash } = generateOptimalMove(matchData.gameType as GameType);
            
            // Save to memory for revealing later
            pendingReveals.set(Number(matchId), { move, secret });

            // Commit move to chain
            const tx = await arenaContract.commitMove(matchId, commitHash);
            console.log(`🔒 Move committed for Match ${matchId}. TX: ${tx.hash}`);
            
            // We do NOT reveal yet. We must wait for the opponent to commit their move.

        } catch (error: any) {
             console.error(`❌ Failed to process MatchAccepted for ${matchId}:`, error.reason || error.message);
        }
    });

    // ------------------------------------------------------------------------
    // Reactivity Event 3: MoveCommitted
    // Action: If the opponent just committed, and we've already committed, it's safe to REVEAL.
    // ------------------------------------------------------------------------
    arenaContract.on("MoveCommitted", async (matchId, player, event) => {
        // If WE just committed, do nothing. Wait for them.
        if (player === wallet.address) return;

        // Check if we have a pending reveal for this match (meaning we already committed)
        const matchIdNum = Number(matchId);
        const pending = pendingReveals.get(matchIdNum);
        
        if (pending) {
            console.log(`\n👀 [REACTIVITY PUSH] Opponent committed move for Match ${matchIdNum}. Revealing our hand...`);
            try {
                const tx = await arenaContract.revealMove(matchId, pending.move, pending.secret);
                console.log(`🎲 Move revealed! TX: ${tx.hash}`);
                
                // Cleanup memory
                pendingReveals.delete(matchIdNum);
            } catch (error: any) {
                 console.error(`❌ Failed to reveal move for Match ${matchIdNum}:`, error.reason || error.message);
            }
        }
    });

    // ------------------------------------------------------------------------
    // Reactivity Event 4: MatchCompleted
    // Action: OFF-CHAIN REACTIVITY -> Record the result in the Leaderboard.
    // This allows the Leaderboard to be "reactive" to Arena events without
    // needing on-chain precompile callbacks.
    // ------------------------------------------------------------------------
    arenaContract.on("MatchCompleted", async (matchId, challenger, opponent, winner, prize, event) => {
        const matchIdNum = Number(matchId);
        const isTie = (winner === ethers.ZeroAddress);
        let loser = ethers.ZeroAddress;

        if (!isTie) {
            loser = (winner === challenger) ? opponent : challenger;
        }

        console.log(`\n🏁 [REACTIVITY PUSH] Match ${matchIdNum} completed. Recording result to Leaderboard...`);
        
        try {
            // Record the match result in the leaderboard contract
            // The Agent is authorized to call this.
            const tx = await leaderboardContract.recordMatchResult(winner, loser, challenger, opponent, prize, isTie);
            console.log(`📈 Leaderboard updated! TX: ${tx.hash}`);
            
            if (winner === wallet.address) {
                console.log(`🏆 NEXUS WON! Gained ${ethers.formatEther(prize)} RFX`);
            } else if (isTie) {
                console.log(`🤝 TIE.`);
            } else {
                console.log(`💀 NEXUS LOST.`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to update leaderboard for match ${matchIdNum}:`, error.reason || error.message);
        }
    });

    // Handle process termination cleanly
    process.on('SIGINT', () => {
        console.log("🛑 Shutting down Reactivity listener...");
        provider.removeAllListeners();
        process.exit();
    });
}
