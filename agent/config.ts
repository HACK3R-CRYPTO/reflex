import { defineChain } from 'viem';
import 'dotenv/config';

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: [process.env.RPC_URL || 'https://dream-rpc.somnia.network'],
      webSocket: [process.env.WS_URL || 'ws://api.infra.testnet.somnia.network/ws'],
    },
    public: {
      http: [process.env.RPC_URL || 'https://dream-rpc.somnia.network'],
      webSocket: [process.env.WS_URL || 'ws://api.infra.testnet.somnia.network/ws'],
    },
  },
});

export const CONTRACTS = {
  arenaPlatform: process.env.ARENA_PLATFORM_ADDRESS as `0x${string}`,
  reflexToken: process.env.REFLEX_TOKEN_ADDRESS as `0x${string}`,
  reflexPass: process.env.REFLEX_PASS_ADDRESS as `0x${string}`,
  agentRegistry: process.env.AGENT_REGISTRY_ADDRESS as `0x${string}`,
  leaderboard: process.env.LEADERBOARD_ADDRESS as `0x${string}`,
};

// Game type enum matching contract
export enum GameType {
  RockPaperScissors = 0,
  DiceRoll = 1,
  StrategyBattle = 2,
  CoinFlip = 3,
  TicTacToe = 4,
}

// Match state enum
export enum MatchState {
  Proposed = 0,
  Accepted = 1,
  Committed = 2,
  Revealed = 3,
  Cancelled = 4,
  Expired = 5,
  InProgress = 6,
}
