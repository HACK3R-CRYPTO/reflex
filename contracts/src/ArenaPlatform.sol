// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ArenaPlatform
 * @notice Commit-reveal based PvP Wagering platform for Reflex
 * @dev Optimized for gas efficiency, custom errors, and structured storage.
 */
contract ArenaPlatform is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Custom Errors ---
    error InvalidWager();
    error MatchNotAvailable();
    error NotYourMatch();
    error MatchNotActive();
    error NotInMatch();
    error AlreadyCommitted();
    error MustCommitFirst();
    error AlreadyRevealed();
    error InvalidReveal();
    error InvalidMove();
    error CannotCancel();
    error OnlyChallengerCanCancel();

    // --- Enums ---
    enum MatchStatus {
        Proposed,
        Accepted,
        Completed,
        Cancelled
    }

    enum GameType {
        RockPaperScissors, // 0
        DiceRoll,          // 1
        StrategyBattle,    // 2
        CoinFlip,          // 3
        TicTacToe          // 4
    }

    // --- Structs ---
    // Pack variables tightly to minimize storage slots (1 slot max size is 256 bits)
    struct Match {
        address challenger; // 160 bits
        GameType gameType;  // 8 bits
        MatchStatus status; // 8 bits
        // 80 bits remaining in slot 1
        
        address opponent;   // 160 bits
        uint96 wager;       // 96 bits -> Fits in slot 2. 96 bits = ~79.2 billion tokens at 18 decimals
        
        address winner;     // 160 bits
        uint64 createdAt;   // 64 bits -> Fits in slot 3
    }

    struct PlayerState {
        bytes32 commitHash; // 256 bits (slot 1)
        uint8 move;         // 8 bits
        bool hasCommitted;  // 8 bits
        bool hasRevealed;   // 8 bits
        // 232 bits remaining in slot 2
    }

    // --- State Variables ---
    uint256 public matchCounter;
    
    // Immutable variables save gas on each read
    IERC20 public immutable REFLEX_TOKEN;
    address public immutable PLATFORM_TREASURY;
    
    // Fees are structured in basis points (1 bp = 0.01%) for precision
    // 400 bps = 4%
    uint256 public constant PLATFORM_FEE_BPS = 400; 

    // mappings
    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public playerMatches;
    mapping(uint256 => mapping(address => PlayerState)) public matchState;

    // --- Events ---
    event MatchProposed(
        uint256 indexed matchId,
        address indexed challenger,
        address indexed opponent,
        uint256 wager,
        GameType gameType
    );
    event MatchAccepted(uint256 indexed matchId, address indexed opponent);
    event MoveCommitted(uint256 indexed matchId, address indexed player);
    event MoveRevealed(uint256 indexed matchId, address indexed player, uint8 move);
    event MatchCompleted(uint256 indexed matchId, address challenger, address opponent, address winner, uint256 prize);
    event MatchCancelled(uint256 indexed matchId);

    constructor(address _treasury, address _reflexToken) Ownable(msg.sender) {
        PLATFORM_TREASURY = _treasury;
        REFLEX_TOKEN = IERC20(_reflexToken);
    }

    /**
     * @notice Proposes a new match against an opponent or open challenge
     * @param _opponent Address of the opponent, or address(0) for open challenge
     * @param _gameType The game type to play
     * @param _wager The amount of RFX to wager (must be less than ~79B tokens due to uint96 packing)
     * @return matchId The ID of the newly created match
     */
    function proposeMatch(
        address _opponent,
        GameType _gameType,
        uint96 _wager
    ) external nonReentrant returns (uint256 matchId) {
        if (_wager == 0) revert InvalidWager();
        
        // Transfer tokens first (Check-Effects-Interactions pattern)
        REFLEX_TOKEN.safeTransferFrom(msg.sender, address(this), _wager);

        // Uses unchecked for gas efficiency, matchCounter will not overflow realistically
        unchecked {
            matchId = matchCounter++;
        }

        matches[matchId] = Match({
            challenger: msg.sender,
            opponent: _opponent,
            wager: _wager,
            gameType: _gameType,
            status: MatchStatus.Proposed,
            winner: address(0),
            createdAt: uint64(block.timestamp)
        });

        playerMatches[msg.sender].push(matchId);
        if (_opponent != address(0)) {
            playerMatches[_opponent].push(matchId);
        }

        emit MatchProposed(matchId, msg.sender, _opponent, _wager, _gameType);
    }

    /**
     * @notice Accepts a proposed match
     * @param _matchId The ID of the match to accept
     */
    function acceptMatch(uint256 _matchId) external nonReentrant {
        Match storage m = matches[_matchId];
        if (m.status != MatchStatus.Proposed) revert MatchNotAvailable();
        if (m.opponent != address(0) && m.opponent != msg.sender) revert NotYourMatch();

        uint96 requiredWager = m.wager;

        // Effects
        m.opponent = msg.sender;
        m.status = MatchStatus.Accepted;

        // Gas optimization: do not loop to check if array contains element. 
        // Just push. A little UI redundancy is cheaper than on-chain loop reading.
        playerMatches[msg.sender].push(_matchId);

        // Interactions
        REFLEX_TOKEN.safeTransferFrom(msg.sender, address(this), requiredWager);

        emit MatchAccepted(_matchId, msg.sender);
    }

    /**
     * @notice Commit move hash (hash of move + secret)
     */
    function commitMove(uint256 _matchId, bytes32 _commitHash) external nonReentrant {
        Match memory m = matches[_matchId]; // Cache in memory for gas savings since we do multiple reads
        if (m.status != MatchStatus.Accepted) revert MatchNotActive();
        if (msg.sender != m.challenger && msg.sender != m.opponent) revert NotInMatch();
        
        PlayerState storage state = matchState[_matchId][msg.sender];
        if (state.hasCommitted) revert AlreadyCommitted();

        state.commitHash = _commitHash;
        state.hasCommitted = true;

        emit MoveCommitted(_matchId, msg.sender);
    }

    /**
     * @notice Reveal move with the plaintext move and secret salt used in the hash
     */
    function revealMove(uint256 _matchId, uint8 _move, string calldata _secret) external nonReentrant {
        Match storage m = matches[_matchId];
        if (m.status != MatchStatus.Accepted) revert MatchNotActive();
        if (msg.sender != m.challenger && msg.sender != m.opponent) revert NotInMatch();
        
        PlayerState storage state = matchState[_matchId][msg.sender];
        if (!state.hasCommitted) revert MustCommitFirst();
        if (state.hasRevealed) revert AlreadyRevealed();

        // Use inline assembly for highly optimized keccak256
        bytes32 expectedHash;
        bytes memory encodedData = abi.encodePacked(_move, _secret);
        assembly {
            expectedHash := keccak256(add(encodedData, 32), mload(encodedData))
        }
        
        if (state.commitHash != expectedHash) revert InvalidReveal();

        GameType cachedGameType = m.gameType;
        if (cachedGameType == GameType.RockPaperScissors) {
            if (_move > 2) revert InvalidMove();
        } else if (cachedGameType == GameType.DiceRoll) {
            if (_move < 1 || _move > 6) revert InvalidMove();
        } else if (cachedGameType == GameType.StrategyBattle) {
            if (_move > 9) revert InvalidMove();
        } else if (cachedGameType == GameType.CoinFlip) {
            if (_move > 1) revert InvalidMove();
        } else if (cachedGameType == GameType.TicTacToe) {
            if (_move > 8) revert InvalidMove(); // For simplified 1-shot TTT representations
        }

        state.move = _move;
        state.hasRevealed = true;

        emit MoveRevealed(_matchId, msg.sender, _move);

        address challenger = m.challenger;
        address opponent = m.opponent;
        PlayerState storage challengerState = matchState[_matchId][challenger];
        PlayerState storage opponentState = matchState[_matchId][opponent];

        if (challengerState.hasRevealed && opponentState.hasRevealed) {
            _resolveMatch(_matchId, m, challenger, opponent, challengerState.move, opponentState.move);
        }
    }

    /**
     * @dev Internal resolution logic comparing the two revealed moves
     */
    function _resolveMatch(
        uint256 _matchId, 
        Match storage m, 
        address challenger, 
        address opponent, 
        uint8 challengerMove, 
        uint8 opponentMove
    ) internal {
        GameType gameType = m.gameType;
        address winner = address(0);

        if (gameType == GameType.RockPaperScissors) {
            if (challengerMove != opponentMove) {
                // Determine winner safely without modulo
                if (
                    (challengerMove == 0 && opponentMove == 2) || 
                    (challengerMove == 1 && opponentMove == 0) || 
                    (challengerMove == 2 && opponentMove == 1)
                ) {
                    winner = challenger;
                } else {
                    winner = opponent;
                }
            }
        } else if (gameType == GameType.DiceRoll || gameType == GameType.StrategyBattle) {
            if (challengerMove > opponentMove) winner = challenger;
            else if (opponentMove > challengerMove) winner = opponent;
        } else if (gameType == GameType.CoinFlip) {
            // Pseudo-random resolution using block data
            uint256 randomValue = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _matchId)));
            // casting to 'uint8' is safe because randomValue % 2 is max 1
            // forge-lint: disable-next-line(unsafe-typecast)
            uint8 actualOutcome = uint8(randomValue % 2);
            // forge-lint: disable-next-line(unsafe-typecast)
            
            bool challengerCorrect = (challengerMove == actualOutcome);
            bool opponentCorrect = (opponentMove == actualOutcome);

            if (challengerCorrect && !opponentCorrect) winner = challenger;
            else if (!challengerCorrect && opponentCorrect) winner = opponent;
        } else if (gameType == GameType.TicTacToe) {
            // Pseudo-random resolution for simplified Tic-Tac-Toe since 
            // a single move hash can't capture a full 9-move iterative game
            // without complex state channels. This ensures it's playable 
            // fairly in a 1-shot commit-reveal format.
            uint256 randomValue = uint256(keccak256(abi.encodePacked(block.timestamp, _matchId, challengerMove, opponentMove)));
            // forge-lint: disable-next-line(unsafe-typecast)
            uint8 tieBreaker = uint8(randomValue % 3);
            
            if (tieBreaker == 0) winner = challenger;
            else if (tieBreaker == 1) winner = opponent;
            // 2 is a tie
        }

        m.status = MatchStatus.Completed;
        m.winner = winner;

        uint256 matchWager = m.wager;
        uint256 totalPool = matchWager * 2;
        
        if (winner == address(0)) {
            // Tie: return wagers
            REFLEX_TOKEN.safeTransfer(challenger, matchWager);
            REFLEX_TOKEN.safeTransfer(opponent, matchWager);
            emit MatchCompleted(_matchId, challenger, opponent, address(0), 0);
        } else {
            uint256 platformFee = (totalPool * PLATFORM_FEE_BPS) / 10000;
            uint256 prize = totalPool - platformFee;
            
            REFLEX_TOKEN.safeTransfer(PLATFORM_TREASURY, platformFee / 2); // Burn remaining half intrinsically
            REFLEX_TOKEN.safeTransfer(winner, prize);
            
            emit MatchCompleted(_matchId, challenger, opponent, winner, prize);
        }
    }

    /**
     * @notice Cancel proposed match
     */
    function cancelMatch(uint256 _matchId) external nonReentrant {
        Match memory m = matches[_matchId];
        if (m.status != MatchStatus.Proposed) revert CannotCancel();
        if (m.challenger != msg.sender) revert OnlyChallengerCanCancel();

        matches[_matchId].status = MatchStatus.Cancelled;
        REFLEX_TOKEN.safeTransfer(m.challenger, m.wager);

        emit MatchCancelled(_matchId);
    }

    /**
     * @notice Returns player match IDs
     * @dev Use sparingly outside of off-chain readings since unbounded arrays cost gas to return
     */
    function getPlayerMatches(address _player) external view returns (uint256[] memory) {
        return playerMatches[_player];
    }
}
