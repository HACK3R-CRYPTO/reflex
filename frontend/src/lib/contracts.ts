import { defineChain } from "viem";

export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  network: "somnia-testnet",
  nativeCurrency: { decimals: 18, name: "STT", symbol: "STT" },
  rpcUrls: {
    default: {
      http: ["https://dream-rpc.somnia.network"],
      webSocket: ["wss://dream-rpc.somnia.network/ws"],
    },
    public: {
      http: ["https://dream-rpc.somnia.network"],
      webSocket: ["wss://dream-rpc.somnia.network/ws"],
    },
  },
  blockExplorers: {
    default: { name: "Somnia Explorer", url: "https://somnia-testnet.socialscan.io" },
  },
});

export const REFLEX_TOKEN_ADDRESS = "0x235a7a9e52069286981d2e6848593bc2ce64b291" as `0x${string}`;
export const ARENA_PLATFORM_ADDRESS = "0x4f4b7659b709f2470dee6a4afafc3eaf995074d4" as `0x${string}`;
export const REFLEX_PASS_ADDRESS = "0x4583187e8f166159a0a438d60f0b8be5a0fd901a" as `0x${string}`;
export const REFLEX_SWAP_ADDRESS = "0x7dadf656064ad2815f7a15982b8dcfba7f9e4cf9" as `0x${string}`;
export const AGENT_REGISTRY_ADDRESS = "0x1faad51426d876a07544f8d3290042971f435276" as `0x${string}`;
export const REACTIVE_LEADERBOARD_ADDRESS = "0x2dfffd643df2545e1f195a0d77b9cc6c9ef672ed" as `0x${string}`;
export const REACTIVE_HANDLER_ADDRESS = "0xa9b7b9cf9d9d1f3d128f2b29c0e9513053f6515f" as `0x${string}`;

export const CONTRACTS = {
  reflexToken: REFLEX_TOKEN_ADDRESS,
  reflexSwap: REFLEX_SWAP_ADDRESS,
  reflexPass: REFLEX_PASS_ADDRESS,
  agentRegistry: AGENT_REGISTRY_ADDRESS,
  arenaPlatform: ARENA_PLATFORM_ADDRESS,
  leaderboard: REACTIVE_LEADERBOARD_ADDRESS,
  reactiveHandler: REACTIVE_HANDLER_ADDRESS,
} as const;

export enum GameType {
  RockPaperScissors = 0,
  DiceRoll = 1,
  StrategyBattle = 2,
  CoinFlip = 3,
  TicTacToe = 4,
}

export const GAME_NAMES: Record<number, string> = {
  0: "Rock Paper Scissors",
  1: "Dice Roll",
  2: "Strategy Battle",
  3: "Coin Flip",
  4: "Tic Tac Toe",
};

export enum MatchState {
  Proposed = 0,
  Accepted = 1,
  Committed = 2,
  Revealed = 3,
  Cancelled = 4,
  Expired = 5,
  InProgress = 6,
}
