"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, LEADERBOARD_ABI, ARENA_ABI, SOMNIA_RPC, GAME_TYPES } from "./contracts";

export interface PlayerStat {
  address: string;
  wins: number;
  losses: number;
  ties: number;
  score: number;
  totalEarnings: bigint;
}

export interface LiveMatch {
  matchId: number;
  challenger: string;
  opponent: string;
  wager: bigint;
  gameType: string;
  status: "proposed" | "active" | "completed";
  winner?: string;
  prize?: bigint;
  timestamp: number;
}

// ─── Leaderboard Hook ──────────────────────────────────────────────────────

export function useLeaderboard() {
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAddress, setUpdatedAddress] = useState<string | null>(null);
  const providerRef = useRef<ethers.JsonRpcProvider | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(SOMNIA_RPC);
      providerRef.current = provider;
      const contract = new ethers.Contract(CONTRACTS.REACTIVE_LEADERBOARD, LEADERBOARD_ABI, provider);

      const addresses: string[] = await contract.getAllKnownPlayers();
      if (addresses.length === 0) { setLoading(false); return; }

      const stats = await Promise.all(
        addresses.map(async (addr) => {
          const s = await contract.getPlayerStats(addr);
          return {
            address: addr,
            wins: Number(s[0]),
            losses: Number(s[1]),
            ties: Number(s[2]),
            score: Number(s[3]),
            totalEarnings: s[4] as bigint,
          } as PlayerStat;
        })
      );

      setPlayers(stats.sort((a, b) => b.score - a.score));
      setLoading(false);

      // Subscribe to live updates
      contract.on("LeaderboardUpdated", (player: string, wins: bigint, losses: bigint, score: bigint, totalEarnings: bigint) => {
        setUpdatedAddress(player.toLowerCase());
        setTimeout(() => setUpdatedAddress(null), 2000);

        setPlayers((prev) => {
          const existing = prev.find((p) => p.address.toLowerCase() === player.toLowerCase());
          const updated: PlayerStat = existing
            ? { ...existing, wins: Number(wins), losses: Number(losses), score: Number(score), totalEarnings }
            : { address: player, wins: Number(wins), losses: Number(losses), ties: 0, score: Number(score), totalEarnings };

          const next = existing
            ? prev.map((p) => p.address.toLowerCase() === player.toLowerCase() ? updated : p)
            : [...prev, updated];

          return next.sort((a, b) => b.score - a.score);
        });
      });
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    return () => {
      providerRef.current?.destroy();
    };
  }, [fetchAll]);

  return { players, loading, updatedAddress };
}

// ─── Live Match Feed Hook ──────────────────────────────────────────────────

export function useMatchFeed(maxItems = 20) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const providerRef = useRef<ethers.JsonRpcProvider | null>(null);

  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(SOMNIA_RPC);
    providerRef.current = provider;
    const contract = new ethers.Contract(CONTRACTS.ARENA_PLATFORM, ARENA_ABI, provider);

    const addOrUpdate = (update: Partial<LiveMatch> & { matchId: number }) => {
      setMatches((prev) => {
        const idx = prev.findIndex((m) => m.matchId === update.matchId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...update };
          return next;
        }
        return [update as LiveMatch, ...prev].slice(0, maxItems);
      });
    };

    // Pull recent events from last 1000 blocks
    const loadRecent = async () => {
      try {
        const block = await provider.getBlockNumber();
        const from = Math.max(0, block - 1000);

        const proposed = await contract.queryFilter(contract.filters.MatchProposed(), from);
        const accepted = await contract.queryFilter(contract.filters.MatchAccepted(), from);
        const completed = await contract.queryFilter(contract.filters.MatchCompleted(), from);

        const matchMap = new Map<number, LiveMatch>();

        for (const e of proposed) {
          const [matchId, challenger, opponent, wager, gameType] = (e as ethers.EventLog).args;
          matchMap.set(Number(matchId), {
            matchId: Number(matchId),
            challenger, opponent,
            wager: wager as bigint,
            gameType: GAME_TYPES[Number(gameType)] ?? "RPS",
            status: "proposed",
            timestamp: Date.now(),
          });
        }
        for (const e of accepted) {
          const [matchId] = (e as ethers.EventLog).args;
          const m = matchMap.get(Number(matchId));
          if (m) matchMap.set(Number(matchId), { ...m, status: "active" });
        }
        for (const e of completed) {
          const [matchId, , , winner, prize] = (e as ethers.EventLog).args;
          const m = matchMap.get(Number(matchId));
          if (m) matchMap.set(Number(matchId), { ...m, status: "completed", winner, prize: prize as bigint });
        }

        setMatches([...matchMap.values()].sort((a, b) => b.matchId - a.matchId).slice(0, maxItems));
      } catch (e) {
        console.error("Match feed error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadRecent();

    // Live updates
    contract.on("MatchProposed", (matchId, challenger, opponent, wager, gameType) => {
      addOrUpdate({ matchId: Number(matchId), challenger, opponent, wager, gameType: GAME_TYPES[Number(gameType)] ?? "RPS", status: "proposed", timestamp: Date.now() });
    });
    contract.on("MatchAccepted", (matchId) => {
      addOrUpdate({ matchId: Number(matchId), status: "active", timestamp: Date.now() });
    });
    contract.on("MatchCompleted", (matchId, _c, _o, winner, prize) => {
      addOrUpdate({ matchId: Number(matchId), status: "completed", winner, prize, timestamp: Date.now() });
    });
    contract.on("MatchCancelled", (matchId) => {
      setMatches((prev) => prev.filter((m) => m.matchId !== Number(matchId)));
    });

    return () => {
      contract.removeAllListeners();
      provider.destroy();
    };
  }, [maxItems]);

  return { matches, loading };
}
