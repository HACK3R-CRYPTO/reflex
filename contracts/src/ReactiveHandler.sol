// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

/// @title ReactiveHandler — Reacts to ArenaPlatform events via Somnia Reactivity
/// @notice Invoked by Somnia validators when ArenaPlatform events fire.
///         Emits friendlier reactive events for the frontend and off-chain consumers.
contract ReactiveHandler is SomniaEventHandler, Ownable {

    // PlayerMoved(uint256 indexed matchId, address indexed player, uint8 move)
    bytes32 public constant PLAYER_MOVED_TOPIC = keccak256("PlayerMoved(uint256,address,uint8)");

    // MatchCompleted(uint256 indexed matchId, address indexed winner, address indexed loser, uint256 payout, uint8 aiMove)
    bytes32 public constant MATCH_COMPLETED_TOPIC = keccak256("MatchCompleted(uint256,address,address,uint256,uint8)");

    // SoloScoreSubmitted(address indexed player, uint256 score, uint8 gameType)
    bytes32 public constant SOLO_SCORE_TOPIC = keccak256("SoloScoreSubmitted(address,uint256,uint8)");

    address public arenaPlatform;

    /// @notice Emitted when the Somnia Relayer pushes a PlayerMoved event to this contract
    event ReactivePlayerMoved(uint256 indexed matchId, address indexed player, uint8 move);

    /// @notice Emitted when a match is fully resolved (winner/loser determined)
    event ReactiveMatchCompleted(uint256 indexed matchId, address indexed winner, address indexed loser, uint256 payout, uint8 aiMove);

    /// @notice Emitted when a solo score is submitted
    event ReactiveSoloScore(address indexed player, uint256 score, uint8 gameType);

    constructor(address _owner) Ownable(_owner) {}

    function setArenaPlatform(address _arena) external onlyOwner {
        arenaPlatform = _arena;
    }

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        // Only react to ArenaPlatform events
        if (emitter != arenaPlatform) return;
        if (eventTopics.length == 0) return;

        bytes32 topic0 = eventTopics[0];

        if (topic0 == PLAYER_MOVED_TOPIC) {
            // topics: [sig, matchId, player]
            // data: (uint8 move)
            uint256 matchId = uint256(eventTopics[1]);
            address player = address(uint160(uint256(eventTopics[2])));
            (uint8 move) = abi.decode(data, (uint8));
            emit ReactivePlayerMoved(matchId, player, move);

        } else if (topic0 == MATCH_COMPLETED_TOPIC) {
            // topics: [sig, matchId, winner, loser]
            // data: (uint256 payout, uint8 aiMove)
            uint256 matchId = uint256(eventTopics[1]);
            address winner = address(uint160(uint256(eventTopics[2])));
            address loser = address(uint160(uint256(eventTopics[3])));
            (uint256 payout, uint8 aiMove) = abi.decode(data, (uint256, uint8));
            emit ReactiveMatchCompleted(matchId, winner, loser, payout, aiMove);

        } else if (topic0 == SOLO_SCORE_TOPIC) {
            // topics: [sig, player]
            // data: (uint256 score, uint8 gameType)
            address player = address(uint160(uint256(eventTopics[1])));
            (uint256 score, uint8 gameType) = abi.decode(data, (uint256, uint8));
            emit ReactiveSoloScore(player, score, gameType);
        }
    }
}
