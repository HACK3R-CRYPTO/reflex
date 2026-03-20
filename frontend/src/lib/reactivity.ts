import { createPublicClient, webSocket, type Hex, decodeEventLog } from "viem";
import { somniaTestnet, CONTRACTS } from "./contracts";
import { ArenaPlatformABI, LeaderboardABI } from "./abis";

let wsClient: ReturnType<typeof createPublicClient> | null = null;

function getWsClient() {
  if (!wsClient) {
    wsClient = createPublicClient({
      chain: somniaTestnet,
      transport: webSocket("wss://dream-rpc.somnia.network/ws"),
    });
  }
  return wsClient;
}

export type MatchEvent = {
  type: "moved" | "completed";
  matchId: bigint;
  player?: string;
  winner?: string;
  loser?: string;
  gameType?: number;
  move?: number;
  aiMove?: number;
  wager?: bigint;
  payout?: bigint;
};

export type LeaderboardEvent = {
  player: string;
  newScore: bigint;
};

export function watchArenaEvents(onEvent: (event: MatchEvent) => void) {
  const client = getWsClient();

  const unwatch = client.watchContractEvent({
    address: CONTRACTS.arenaPlatform,
    abi: ArenaPlatformABI,
    onLogs: (logs) => {
      for (const log of logs) {
        try {
          if (log.eventName === "PlayerMoved") {
            onEvent({
              type: "moved",
              matchId: (log.args as any).matchId,
              player: (log.args as any).player,
              move: (log.args as any).move,
            });
          } else if (log.eventName === "MatchCompleted") {
            onEvent({
              type: "completed",
              matchId: (log.args as any).matchId,
              winner: (log.args as any).winner,
              loser: (log.args as any).loser,
              payout: (log.args as any).payout,
              aiMove: (log.args as any).aiMove,
            });
          }
        } catch {}
      }
    },
  });

  return unwatch;
}

export function watchLeaderboard(onEvent: (event: LeaderboardEvent) => void) {
  const client = getWsClient();

  const unwatch = client.watchContractEvent({
    address: CONTRACTS.leaderboard,
    abi: LeaderboardABI,
    onLogs: (logs) => {
      for (const log of logs) {
        if (log.eventName === "LeaderboardUpdated") {
          onEvent({
            player: (log.args as { player: string }).player,
            newScore: (log.args as { newScore: bigint }).newScore,
          });
        }
      }
    },
  });

  return unwatch;
}
