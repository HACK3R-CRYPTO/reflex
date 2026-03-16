// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

/**
 * @title ReactiveLeaderboard
 * @notice On-chain leaderboard that reacts to ArenaPlatform MatchCompleted events
 *         via Somnia's native on-chain reactivity. Validators automatically invoke
 *         the `onEvent` handler whenever a match finishes — no off-chain agent needed.
 * @dev Inherits SomniaEventHandler which ensures only the Somnia Reactivity Precompile
 *      at 0x0100 can invoke `onEvent`. No trusted updater role required.
 */
contract ReactiveLeaderboard is Ownable, SomniaEventHandler {

    // --- Custom Errors ---
    error InvalidAddress();
    error WrongEmitter();

    // --- Structs ---
    struct PlayerStats {
        uint64 wins;           // 64 bits (Slot 1)
        uint64 losses;         // 64 bits
        uint64 ties;           // 64 bits
        uint64 score;          // 64 bits
        // Slot 1 perfectly packed (256 bits)

        uint256 totalEarnings; // 256 bits (Slot 2)
    }

    // --- State Variables ---
    mapping(address => PlayerStats) public stats;

    // Track known players for off-chain enumeration
    address[] public knownPlayers;
    mapping(address => bool) private _isKnown;

    /// @notice Address of the ArenaPlatform contract whose events we react to
    address public immutable arenaPlatform;

    /// @notice keccak256("MatchCompleted(uint256,address,address,address,uint256)")
    bytes32 public constant MATCH_COMPLETED_TOPIC =
        keccak256("MatchCompleted(uint256,address,address,address,uint256)");

    // --- Events ---
    event LeaderboardUpdated(
        address indexed player,
        uint64 wins,
        uint64 losses,
        uint64 score,
        uint256 totalEarnings
    );

    event SoloScoreSubmitted(address indexed player, uint64 score);

    // Emitted when a MatchCompleted event is successfully processed on-chain
    event MatchResultRecorded(
        uint256 indexed matchId,
        address indexed winner,
        address challenger,
        address opponent,
        uint256 prize,
        bool isTie
    );

    constructor(address _arenaPlatform) Ownable(msg.sender) {
        arenaPlatform = _arenaPlatform;
    }

    // =========================================================================
    // ON-CHAIN REACTIVITY — invoked by validators at 0x0100
    // =========================================================================

    /**
     * @dev Called by the Somnia Reactivity Precompile (0x0100) whenever a subscribed
     *      event is emitted. We decode the MatchCompleted payload and update stats.
     *
     *      MatchCompleted event signature:
     *        event MatchCompleted(uint256 indexed matchId, address challenger,
     *                             address opponent, address winner, uint256 prize)
     *
     *      eventTopics layout (indexed params):
     *        [0] = keccak256("MatchCompleted(uint256,address,address,address,uint256)")
     *        [1] = matchId (indexed)
     *
     *      data layout (non-indexed params ABI-encoded):
     *        [0..31]   = challenger (address, left-padded)
     *        [32..63]  = opponent   (address, left-padded)
     *        [64..95]  = winner     (address, left-padded)
     *        [96..127] = prize      (uint256)
     */
    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        // Safety: only process events from our ArenaPlatform
        if (emitter != arenaPlatform) revert WrongEmitter();

        // Safety: confirm this is a MatchCompleted event
        if (eventTopics.length == 0 || eventTopics[0] != MATCH_COMPLETED_TOPIC) return;

        // Decode the non-indexed ABI-encoded data
        // (challenger, opponent, winner, prize)
        (address challenger, address opponent, address winner, uint256 prize) =
            abi.decode(data, (address, address, address, uint256));

        // matchId was indexed — extract from topic[1]
        uint256 matchId = uint256(eventTopics[1]);

        bool isTie = (winner == address(0));
        _processResult(matchId, challenger, opponent, winner, prize, isTie);
    }

    // =========================================================================
    // INTERNAL LOGIC
    // =========================================================================

    function _processResult(
        uint256 matchId,
        address challenger,
        address opponent,
        address winner,
        uint256 prize,
        bool isTie
    ) internal {
        if (challenger != address(0)) _addToKnown(challenger);
        if (opponent != address(0)) _addToKnown(opponent);

        if (isTie) {
            unchecked {
                if (challenger != address(0)) stats[challenger].ties++;
                if (opponent != address(0)) stats[opponent].ties++;
            }
        } else {
            address loser = (winner == challenger) ? opponent : challenger;

            unchecked {
                PlayerStats storage winnerStats = stats[winner];
                winnerStats.wins++;
                winnerStats.totalEarnings += prize;
                winnerStats.score += 50; // 50 points per PvP win

                PlayerStats storage loserStats = stats[loser];
                loserStats.losses++;

                emit LeaderboardUpdated(
                    winner,
                    winnerStats.wins,
                    winnerStats.losses,
                    winnerStats.score,
                    winnerStats.totalEarnings
                );
                emit LeaderboardUpdated(
                    loser,
                    loserStats.wins,
                    loserStats.losses,
                    loserStats.score,
                    loserStats.totalEarnings
                );
            }
        }

        emit MatchResultRecorded(matchId, winner, challenger, opponent, prize, isTie);
    }

    // =========================================================================
    // OWNER FUNCTIONS
    // =========================================================================

    /**
     * @notice Solo games (e.g. Rhythm) submit high scores directly to this contract.
     */
    function submitSoloScore(address player, uint64 scoreAdded) external onlyOwner {
        if (player == address(0)) revert InvalidAddress();

        _addToKnown(player);

        PlayerStats storage playerStats = stats[player];
        unchecked {
            playerStats.score += scoreAdded;
        }

        emit SoloScoreSubmitted(player, playerStats.score);
        emit LeaderboardUpdated(
            player,
            playerStats.wins,
            playerStats.losses,
            playerStats.score,
            playerStats.totalEarnings
        );
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return stats[player];
    }

    function findPlayers(uint256 startIndex, uint256 count) external view returns (address[] memory) {
        uint256 limit = startIndex + count;
        if (limit > knownPlayers.length) limit = knownPlayers.length;

        address[] memory result = new address[](limit - startIndex);
        for (uint256 i = startIndex; i < limit; i++) {
            result[i - startIndex] = knownPlayers[i];
        }
        return result;
    }

    function getAllKnownPlayers() external view returns (address[] memory) {
        return knownPlayers;
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    function _addToKnown(address player) internal {
        if (!_isKnown[player]) {
            _isKnown[player] = true;
            knownPlayers.push(player);
        }
    }
}
