// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReactiveLeaderboard
 * @notice On-chain leaderboard tracking stats reactive to Platform events
 * @dev Optimized storage packing and mapping usage to save gas
 */
contract ReactiveLeaderboard is Ownable {
    
    // --- Custom Errors ---
    error InvalidAddress();

    // --- Structs ---
    struct PlayerStats {
        uint64 wins;          // 64 bits (Slot 1)
        uint64 losses;        // 64 bits
        uint64 ties;          // 64 bits
        uint64 score;         // 64 bits, combining PvP + internal metrics 
        // Slot 1 perfectly packed (256 bits)

        uint256 totalEarnings; // 256 bits (Slot 2)
    }

    // --- State Variables ---
    mapping(address => PlayerStats) public stats;
    
    // Track known players for off-chain enumeration (use cautiously due to array growth)
    address[] public knownPlayers;
    mapping(address => bool) private _isKnown;

    // --- Events ---
    event LeaderboardUpdated(
        address indexed player, 
        uint64 wins, 
        uint64 losses, 
        uint64 score,
        uint256 totalEarnings
    );
    
    event SoloScoreSubmitted(address indexed player, uint64 score);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Expected to be called by Somnia Reactivity Engine or ArenaPlatform
     * when a MatchCompleted event is detected.
     */
    function processMatchResult(address winner, address loser, uint256 prize, bool isTie) external {
        if (winner != address(0)) _addToKnown(winner);
        if (loser != address(0)) _addToKnown(loser);

        if (isTie) {
            unchecked {
                if (winner != address(0)) stats[winner].ties++;
                if (loser != address(0)) stats[loser].ties++;
            }
        } else {
            // Unchecked blocks save gas for counters where overflow is effectively impossible
            unchecked {
                PlayerStats storage winnerStats = stats[winner];
                winnerStats.wins++;
                winnerStats.totalEarnings += prize;
                winnerStats.score += 50; // Arbitrary score weighting for PvP wins

                PlayerStats storage loserStats = stats[loser];
                loserStats.losses++;

                emit LeaderboardUpdated(winner, winnerStats.wins, winnerStats.losses, winnerStats.score, winnerStats.totalEarnings);
                emit LeaderboardUpdated(loser, loserStats.wins, loserStats.losses, loserStats.score, loserStats.totalEarnings);
            }
        }
    }

    /**
     * @notice Solo games (e.g. Rhythm) submit high scores directly to this contract.
     */
    function submitSoloScore(address player, uint64 scoreAdded) external {
        if (player == address(0)) revert InvalidAddress();

        _addToKnown(player);
        
        PlayerStats storage playerStats = stats[player];
        unchecked {
            playerStats.score += scoreAdded;
        }
        
        emit SoloScoreSubmitted(player, playerStats.score);
        emit LeaderboardUpdated(player, playerStats.wins, playerStats.losses, playerStats.score, playerStats.totalEarnings);
    }

    /**
     * @dev Internal helper to register a user globally if they are new.
     */
    function _addToKnown(address player) internal {
        if (!_isKnown[player]) {
            _isKnown[player] = true;
            knownPlayers.push(player);
        }
    }

    /**
     * @notice Returns player statistics for UI polling/startup (subsequent updates pushed via events)
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return stats[player];
    }
    
    /**
     * @notice Use cautiously outside off-chain reads - can be gas intensive
     */
    function getAllKnownPlayers() external view returns (address[] memory) {
        return knownPlayers;
    }
}
