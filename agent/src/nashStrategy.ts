import { ethers } from "ethers";

// Enum matching ArenaPlatform.sol
export enum GameType {
    RockPaperScissors = 0,
    DiceRoll = 1,
    StrategyBattle = 2,
    CoinFlip = 3,
    TicTacToe = 4
}

/**
 * Calculates the optimal Nash Equilibrium move for the given game type.
 * Returns both the plaintext move and the generated secret for committing.
 */
export function generateOptimalMove(gameType: GameType): { move: number, secret: string, commitHash: string } {
    const secret = ethers.hexlify(ethers.randomBytes(32)); // 32 bytes of entropy
    let move: number = 0;

    switch (gameType) {
        case GameType.RockPaperScissors:
            // 0: Rock, 1: Paper, 2: Scissors (Optimal: exactly 33.3% each)
            move = Math.floor(Math.random() * 3);
            break;
            
        case GameType.DiceRoll:
            // 1-6 (Optimal: Play aggressively higher, simplified here as pure random)
            move = Math.floor(Math.random() * 6) + 1;
            break;
            
        case GameType.StrategyBattle:
            // 0-9 (Optimal heavily weights 7, 8, 9 depending on opponent model)
            // Simplified mixed strategy favoring high numbers but keeping unpredictability
            const r = Math.random();
            if (r > 0.8) move = 9;
            else if (r > 0.5) move = 8;
            else if (r > 0.2) move = 7;
            else move = Math.floor(Math.random() * 7); // 0-6
            break;
            
        case GameType.CoinFlip:
            // 0 or 1 (Optimal: exactly 50/50)
            move = Math.floor(Math.random() * 2);
            break;

        case GameType.TicTacToe:
            // 0-8 simplified grid representation.
            move = Math.floor(Math.random() * 9);
            break;
            
        default:
            throw new Error(`Unsupported game type: ${gameType}`);
    }

    // Hash matches ArenaPlatform logic:
    // bytes memory encodedData = abi.encodePacked(_move, _secret);
    // expectedHash = keccak256(encodedData);
    
    // In Solidity, uint8 encodes as 1 byte in encodePacked. string encodes as utf8 bytes.
    const encodedData = ethers.solidityPacked(["uint8", "string"], [move, secret]);
    const commitHash = ethers.keccak256(encodedData);

    return { move, secret, commitHash };
}
