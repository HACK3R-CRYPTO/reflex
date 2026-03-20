// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import "./interfaces/IReflex.sol";

/// @title ArenaPlatform — Fully On-Chain Reactive AI Arena
contract ArenaPlatform is ReentrancyGuard, Ownable, SomniaEventHandler {

    enum GameType { RockPaperScissors, DiceRoll, StrategyBattle, CoinFlip }

    struct MatchRequest {
        address player;
        GameType gameType;
        uint256 wager;
        uint8 move;
        uint8 aiMove;
        address winner;
        bool resolved;
        uint256 createdAt;
    }

    IRFX public immutable rfxToken;
    IReflexPass public reflexPass;
    IAgentRegistry public agentRegistry;
    IReactiveLeaderboard public leaderboard;

    uint256 public nextMatchId = 1;
    mapping(uint256 => MatchRequest) public matchRequests;

    uint256 public burnBps = 200;
    uint256 public treasuryBps = 200;
    address public treasury;

    mapping(address => bool) public scoreValidators;
    uint256 public soloRewardPerPoint = 1 ether;
    uint256 public dailyRewardCap = 1000 ether;
    mapping(address => uint256) public lastRewardDay;
    mapping(address => uint256) public dailyRewardsClaimed;

    bytes32 private constant PLAYER_MOVED_SIG = keccak256("PlayerMoved(uint256,address,uint8)");

    event PlayerMoved(uint256 indexed matchId, address indexed player, uint8 move);
    event MatchCompleted(uint256 indexed matchId, address indexed winner, address indexed loser, uint256 payout, uint8 aiMove);
    event SoloScoreSubmitted(address indexed player, uint256 score, uint8 gameType);

    constructor(address _rfxToken, address _reflexPass, address _treasury, address _owner) Ownable(_owner) {
        rfxToken = IRFX(_rfxToken);
        reflexPass = IReflexPass(_reflexPass);
        treasury = _treasury;
    }

    modifier onlyPassHolder() {
        require(reflexPass.hasPass(msg.sender), "Arena: no Reflex Pass");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                                HUMAN VS AI
    //////////////////////////////////////////////////////////////*/

    function playAgainstAI(GameType _gameType, uint256 _wager, uint8 _move) external onlyPassHolder nonReentrant returns (uint256 matchId) {
        require(_wager > 0, "Arena: zero wager");
        _validateMove(_gameType, _move);

        // Player escrows wager
        rfxToken.transferFrom(msg.sender, address(this), _wager);

        matchId = nextMatchId++;
        MatchRequest storage mr = matchRequests[matchId];
        mr.player = msg.sender;
        mr.gameType = _gameType;
        mr.wager = _wager;
        mr.move = _move;
        mr.createdAt = block.timestamp;
        
        emit PlayerMoved(matchId, msg.sender, _move);
    }

    /*//////////////////////////////////////////////////////////////
                        SOMNIA REACTIVITY (AI AGENT)
    //////////////////////////////////////////////////////////////*/

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        require(emitter == address(this), "Invalid emitter");
        require(eventTopics.length >= 2, "Invalid topics");
        require(eventTopics[0] == PLAYER_MOVED_SIG, "Not player move event");

        uint256 matchId = uint256(eventTopics[1]);
        MatchRequest storage mr = matchRequests[matchId];

        if (mr.resolved || mr.player == address(0)) return;
        
        // Generate AI move fairly in a future block
        uint256 randomWord = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    block.number,
                    matchId,
                    address(this)
                )
            )
        );

        uint8 aiMove = _generateAIMove(mr.gameType, randomWord);
        
        // Resolve match
        mr.aiMove = aiMove;
        _resolveReactiveMatch(matchId, aiMove);
    }

    function _generateAIMove(GameType t, uint256 randomWord) internal pure returns (uint8) {
        if (t == GameType.RockPaperScissors) return uint8(randomWord % 3);
        if (t == GameType.DiceRoll) return uint8((randomWord % 6) + 1);
        if (t == GameType.StrategyBattle) return uint8(randomWord % 10);
        if (t == GameType.CoinFlip) return uint8(randomWord % 2);
        return 0;
    }

    function _resolveReactiveMatch(uint256 matchId, uint8 aiMove) internal {
        MatchRequest storage mr = matchRequests[matchId];
        mr.resolved = true;
        
        // Determine winner
        int8 result = _determineWinner(mr.gameType, mr.move, aiMove);
        
        address winner;
        address loser;
        uint256 payout = 0;

        if (result == 1) { // Player won
            winner = mr.player;
            loser = address(this);
            payout = mr.wager * 2;
            
            // Payout human winner
            if (rfxToken.balanceOf(address(this)) >= payout) {
                rfxToken.transfer(winner, payout);
            } else {
                // Refund if house is empty
                rfxToken.transfer(winner, mr.wager);
                payout = mr.wager;
            }
        } else if (result == -1) { // AI won
            winner = address(this);
            loser = mr.player;
            // Pot stays in contract
        } else { // Tie (Draw) - Give wager back
            winner = mr.player;
            loser = address(this);
            payout = mr.wager;
            rfxToken.transfer(winner, payout);
        }

        mr.winner = winner;
        mr.aiMove = aiMove;

        // Update statistics
        if (address(leaderboard) != address(0)) {
            leaderboard.recordPvPResult(winner, loser, payout);
        }
        if (address(agentRegistry) != address(0)) {
            agentRegistry.recordWin(winner);
            agentRegistry.recordLoss(loser);
        }

        emit MatchCompleted(matchId, winner, loser, payout, aiMove);
    }

    function _determineWinner(GameType t, uint8 m1, uint8 m2) internal pure returns (int8) {
        if (t == GameType.RockPaperScissors) {
            if (m1 == m2) return 0;
            if ((m1 + 1) % 3 == m2) return -1;
            return 1;
        }
        if (t == GameType.DiceRoll || t == GameType.StrategyBattle) {
            if (m1 > m2) return 1;
            if (m2 > m1) return -1;
            return 0;
        }
        if (t == GameType.CoinFlip) { return m1 == m2 ? int8(1) : int8(-1); }
        return 0;
    }

    function _validateMove(GameType t, uint8 m) internal pure {
        if (t == GameType.RockPaperScissors) require(m <= 2, "Arena: invalid move");
        else if (t == GameType.DiceRoll) require(m >= 1 && m <= 6, "Arena: invalid move");
        else if (t == GameType.StrategyBattle) require(m <= 9, "Arena: invalid move");
        else if (t == GameType.CoinFlip) require(m <= 1, "Arena: invalid move");
    }

    /*//////////////////////////////////////////////////////////////
                                SOLO SCORE
    //////////////////////////////////////////////////////////////*/

    function submitSoloScore(address _player, uint256 _score, uint8 _gameType) external nonReentrant {
        require(scoreValidators[msg.sender], "Arena: not a validator");
        require(reflexPass.hasPass(_player), "Arena: no pass");
        
        uint256 reward = (_score * soloRewardPerPoint) / 100;
        if (reward == 0) reward = soloRewardPerPoint;

        uint256 today = block.timestamp / 1 days;
        if (lastRewardDay[_player] != today) {
            lastRewardDay[_player] = today;
            dailyRewardsClaimed[_player] = 0;
        }

        uint256 remaining = dailyRewardCap - dailyRewardsClaimed[_player];
        if (remaining == 0) reward = 0;
        else if (reward > remaining) reward = remaining;

        if (reward > 0 && rfxToken.balanceOf(address(this)) >= reward) {
            dailyRewardsClaimed[_player] += reward;
            rfxToken.transfer(_player, reward);
        }

        if (address(leaderboard) != address(0)) {
            leaderboard.submitSoloScore(_player, _score, _gameType);
        }
        emit SoloScoreSubmitted(_player, _score, _gameType);
    }

    /*//////////////////////////////////////////////////////////////
                                ADMIN & VIEW
    //////////////////////////////////////////////////////////////*/

    function setLeaderboard(address _l) external onlyOwner { leaderboard = IReactiveLeaderboard(_l); }
    function setAgentRegistry(address _r) external onlyOwner { agentRegistry = IAgentRegistry(_r); }
    function setScoreValidator(address _v, bool _s) external onlyOwner { scoreValidators[_v] = _s; }
    function setTreasury(address _t) external onlyOwner { treasury = _t; }
    function setSoloRewardPerPoint(uint256 _a) external onlyOwner { soloRewardPerPoint = _a; }
    function setDailyRewardCap(uint256 _c) external onlyOwner { dailyRewardCap = _c; }
    function setFees(uint256 _b, uint256 _t) external onlyOwner {
        require(_b + _t <= 1000, "Arena: fees too high");
        burnBps = _b; treasuryBps = _t;
    }
    function fundHouse(uint256 _amount) external {
        // Anyone can fund the house pool so AI can pay winners
        rfxToken.transferFrom(msg.sender, address(this), _amount);
    }

    function getMatch(uint256 _id) external view returns (
        address player, GameType gameType, uint256 wager, uint8 move, uint8 aiMove, address winner, bool resolved, uint256 createdAt
    ) {
        MatchRequest storage mr = matchRequests[_id];
        return (mr.player, mr.gameType, mr.wager, mr.move, mr.aiMove, mr.winner, mr.resolved, mr.createdAt);
    }
}
