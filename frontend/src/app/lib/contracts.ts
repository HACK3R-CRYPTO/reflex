// Contract addresses deployed on Somnia Testnet (Chain ID: 50312)
export const CONTRACTS = {
  RFX_TOKEN:            "0x2ef34c1CbBA918a7553e1c37f694a2De5332fF91",
  REFLEX_PASS:          "0x949Bc496528aBBd3a48Ab11B3a092C2a54b16360",
  REFLEX_SWAP:          "0x42a53C3Ce6cBf795ba5252b9817FE58f4c984365",
  ARENA_PLATFORM:       "0xABa92335453d8c97c5A550827dffa0E95977384F",
  AGENT_REGISTRY:       "0x1620024163b8C9CE917b82932093A6De22Ba89d8",
  REACTIVE_LEADERBOARD: "0x8BA994E22f9Ec33d0C0dD069939B8f52658980E0",
} as const;

export const SOMNIA_RPC = "https://dream-rpc.somnia.network";
export const SOMNIA_WSS = "wss://dream-rpc.somnia.network/ws";
export const CHAIN_ID = 50312;

// Minimal ABIs
export const LEADERBOARD_ABI = [
  "function getAllKnownPlayers() external view returns (address[])",
  "function getPlayerStats(address player) external view returns (uint64 wins, uint64 losses, uint64 ties, uint64 score, uint256 totalEarnings)",
  "event LeaderboardUpdated(address indexed player, uint64 wins, uint64 losses, uint64 score, uint256 totalEarnings)",
] as const;

export const ARENA_ABI = [
  "event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)",
  "event MatchAccepted(uint256 indexed matchId, address indexed opponent)",
  "event MatchCompleted(uint256 indexed matchId, address challenger, address opponent, address winner, uint256 prize)",
  "event MatchCancelled(uint256 indexed matchId)",
  "function proposeMatch(address opponent, uint256 wager, uint8 gameType) external returns (uint256 matchId)",
] as const;

export const GAME_TYPES = ["RPS", "RPS-5", "Tac-Toe", "Dominance", "Prediction"] as const;
export type GameType = typeof GAME_TYPES[number];

export const NEXUS_ADDRESS = "0xd2df53D9791e98Db221842Dd085F4144014BBE2a";
