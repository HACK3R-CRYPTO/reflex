// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReactiveLeaderboard — On-chain rankings, Somnia Reactivity subscriber
/// @notice Updates rankings atomically when match results land on-chain.
///         Emits events that Somnia's Reactivity layer pushes to frontends via WebSocket.
contract ReactiveLeaderboard is Ownable {

    struct PlayerStats {
        uint256 totalScore;       // Combined score (solo + PvP)
        uint256 soloHighScore;    // Best solo score
        uint256 pvpWins;
        uint256 pvpLosses;
        uint256 pvpDraws;
        uint256 totalWagered;
        uint256 totalEarned;
        uint256 lastUpdated;
    }

    // ── State ──
    mapping(address => PlayerStats) public stats;
    address[] public rankedPlayers;
    mapping(address => bool) public isRanked;

    // Top players cache (gas-efficient for frontend reads)
    address[] public topPlayers;
    uint256 public constant MAX_TOP = 100;

    // Authorized callers (ArenaPlatform)
    mapping(address => bool) public authorizedCallers;

    // Solo score points multiplier
    uint256 public constant PVP_WIN_POINTS = 100;
    uint256 public constant PVP_DRAW_POINTS = 10;
    uint256 public constant SOLO_SCORE_DIVISOR = 100; // score / 100 = points

    // ── Events (Reactivity pushes these to frontend) ──
    event LeaderboardUpdated(address indexed player, uint256 newScore, uint256 rank);
    event PvPResultRecorded(address indexed winner, address indexed loser, uint256 wager);
    event PvPDrawRecorded(address indexed player1, address indexed player2);
    event SoloScoreRecorded(address indexed player, uint256 score, uint8 gameType, uint256 newTotalScore);
    event TopPlayersUpdated(address[] topPlayers);

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender], "Leaderboard: not authorized");
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    // ═══════════════════════════════════════════
    //  RECORDING RESULTS (called by ArenaPlatform)
    // ═══════════════════════════════════════════

    function recordPvPResult(address _winner, address _loser, uint256 _wager) external onlyAuthorized {
        _ensureRanked(_winner);
        _ensureRanked(_loser);

        PlayerStats storage w = stats[_winner];
        w.pvpWins++;
        w.totalWagered += _wager;
        w.totalEarned += _wager; // net positive
        w.totalScore += PVP_WIN_POINTS;
        w.lastUpdated = block.timestamp;

        PlayerStats storage l = stats[_loser];
        l.pvpLosses++;
        l.totalWagered += _wager;
        l.lastUpdated = block.timestamp;

        _updateTopPlayers(_winner);

        emit PvPResultRecorded(_winner, _loser, _wager);
        emit LeaderboardUpdated(_winner, w.totalScore, _getRank(_winner));
        emit LeaderboardUpdated(_loser, l.totalScore, _getRank(_loser));
    }

    function recordPvPDraw(address _player1, address _player2) external onlyAuthorized {
        _ensureRanked(_player1);
        _ensureRanked(_player2);

        stats[_player1].pvpDraws++;
        stats[_player1].totalScore += PVP_DRAW_POINTS;
        stats[_player1].lastUpdated = block.timestamp;

        stats[_player2].pvpDraws++;
        stats[_player2].totalScore += PVP_DRAW_POINTS;
        stats[_player2].lastUpdated = block.timestamp;

        emit PvPDrawRecorded(_player1, _player2);
        emit LeaderboardUpdated(_player1, stats[_player1].totalScore, _getRank(_player1));
        emit LeaderboardUpdated(_player2, stats[_player2].totalScore, _getRank(_player2));
    }

    function submitSoloScore(address _player, uint256 _score, uint8 _gameType) external onlyAuthorized {
        _ensureRanked(_player);

        PlayerStats storage s = stats[_player];

        if (_score > s.soloHighScore) {
            s.soloHighScore = _score;
        }

        uint256 points = _score / SOLO_SCORE_DIVISOR;
        if (points == 0) points = 1; // minimum 1 point
        s.totalScore += points;
        s.lastUpdated = block.timestamp;

        _updateTopPlayers(_player);

        emit SoloScoreRecorded(_player, _score, _gameType, s.totalScore);
        emit LeaderboardUpdated(_player, s.totalScore, _getRank(_player));
    }

    // ═══════════════════════════════════════════
    //  TOP PLAYERS MANAGEMENT
    // ═══════════════════════════════════════════

    function _updateTopPlayers(address _player) internal {
        // If player already in top list, we just need to re-sort (or leave for now)
        // If not, and they beat the 100th player, replace and sort.
        
        bool found = false;
        for (uint256 i = 0; i < topPlayers.length; i++) {
            if (topPlayers[i] == _player) {
                found = true;
                break;
            }
        }

        if (!found) {
            if (topPlayers.length < MAX_TOP) {
                topPlayers.push(_player);
            } else {
                // Find min score index
                uint256 minScore = stats[topPlayers[0]].totalScore;
                uint256 minIdx = 0;
                for (uint256 i = 1; i < topPlayers.length; i++) {
                    if (stats[topPlayers[i]].totalScore < minScore) {
                        minScore = stats[topPlayers[i]].totalScore;
                        minIdx = i;
                    }
                }
                if (stats[_player].totalScore > minScore) {
                    topPlayers[minIdx] = _player;
                }
            }
        }
        
        // Only sort if the list is small enough to not hit gas limits
        // For 100 items, bubble sort is too much. We'll skip sorting on-chain 
        // if it exceeds a threshold, or use a more efficient one.
        if (topPlayers.length <= 20) {
            _sortTopPlayers();
        }

        emit TopPlayersUpdated(topPlayers);
    }

    function _sortTopPlayers() internal {
        uint256 n = topPlayers.length;
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = i + 1; j < n; j++) {
                if (stats[topPlayers[j]].totalScore > stats[topPlayers[i]].totalScore) {
                    address temp = topPlayers[i];
                    topPlayers[i] = topPlayers[j];
                    topPlayers[j] = temp;
                }
            }
        }
    }

    function _getRank(address _player) internal view returns (uint256) {
        for (uint256 i = 0; i < topPlayers.length; i++) {
            if (topPlayers[i] == _player) return i + 1;
        }
        return topPlayers.length + 1; // unranked
    }

    function _ensureRanked(address _player) internal {
        if (!isRanked[_player]) {
            isRanked[_player] = true;
            rankedPlayers.push(_player);
        }
    }

    // ═══════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    function getPlayerStats(address _player) external view returns (PlayerStats memory) {
        return stats[_player];
    }

    function getTopPlayers() external view returns (address[] memory) {
        return topPlayers;
    }

    function getTopPlayersCount() external view returns (uint256) {
        return topPlayers.length;
    }

    function getRankedPlayerCount() external view returns (uint256) {
        return rankedPlayers.length;
    }

    function getPlayerRank(address _player) external view returns (uint256) {
        return _getRank(_player);
    }

    // ═══════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════

    function setAuthorizedCaller(address _caller, bool _status) external onlyOwner {
        authorizedCallers[_caller] = _status;
    }
}
