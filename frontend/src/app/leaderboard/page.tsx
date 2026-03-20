"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { LeaderboardABI } from "@/lib/abis";
import { watchLeaderboard, type LeaderboardEvent } from "@/lib/reactivity";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function LeaderboardPage() {
  const [recentUpdates, setRecentUpdates] = useState<LeaderboardEvent[]>([]);
  const [flashingPlayer, setFlashingPlayer] = useState<string | null>(null);

  const { data: topPlayers } = useReadContract({
    address: CONTRACTS.leaderboard,
    abi: LeaderboardABI,
    functionName: "getTopPlayers",
  });

  useEffect(() => {
    const unwatch = watchLeaderboard((event) => {
      setRecentUpdates((prev) => [event, ...prev].slice(0, 10));
      setFlashingPlayer(event.player);
      setTimeout(() => setFlashingPlayer(null), 2000);
    });
    return () => { unwatch(); };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
      <p className="text-gray-400 mb-8 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Live — updates via Somnia Reactivity
      </p>

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <div className="mb-8 bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
          <p className="text-sm text-violet-400 font-semibold mb-2">Recent Updates</p>
          <div className="space-y-1">
            {recentUpdates.slice(0, 3).map((u, i) => (
              <p key={i} className="text-sm text-gray-400">
                {shortenAddress(u.player)} scored {formatEther(u.newScore)} pts
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Player</div>
          <div className="col-span-2 text-right">Total Score</div>
          <div className="col-span-1 text-right">W</div>
          <div className="col-span-1 text-right">L</div>
          <div className="col-span-1 text-right">D</div>
          <div className="col-span-1 text-right">Solo Best</div>
          <div className="col-span-2 text-right">RFX Earned</div>
        </div>

        {topPlayers && (topPlayers as string[]).length > 0 ? (
          (topPlayers as string[]).map((player, i) => (
            <PlayerRow
              key={player}
              rank={i + 1}
              player={player}
              isFlashing={flashingPlayer?.toLowerCase() === player.toLowerCase()}
            />
          ))
        ) : (
          <p className="p-8 text-center text-gray-500">No players ranked yet. Start playing!</p>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ rank, player, isFlashing }: { rank: number; player: string; isFlashing: boolean }) {
  const { data: stats } = useReadContract({
    address: CONTRACTS.leaderboard,
    abi: LeaderboardABI,
    functionName: "getPlayerStats",
    args: [player as `0x${string}`],
  });

  if (!stats) return null;

  const s = stats as {
    totalScore: bigint; soloHighScore: bigint; pvpWins: bigint;
    pvpLosses: bigint; pvpDraws: bigint; totalMatches: bigint;
    rfxEarned: bigint; rfxWagered: bigint;
  };

  return (
    <div className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-800 items-center transition-all ${
      isFlashing ? "bg-violet-500/10" : "hover:bg-gray-800/50"
    }`}>
      <div className="col-span-1">
        <span className={`font-bold ${rank <= 3 ? "text-amber-400" : "text-gray-500"}`}>
          {rank}
        </span>
      </div>
      <div className="col-span-3 font-mono text-sm">{shortenAddress(player)}</div>
      <div className="col-span-2 text-right font-semibold text-violet-400">{s.totalScore.toString()}</div>
      <div className="col-span-1 text-right text-emerald-400">{s.pvpWins.toString()}</div>
      <div className="col-span-1 text-right text-red-400">{s.pvpLosses.toString()}</div>
      <div className="col-span-1 text-right text-gray-400">{s.pvpDraws.toString()}</div>
      <div className="col-span-1 text-right text-cyan-400">{s.soloHighScore.toString()}</div>
      <div className="col-span-2 text-right text-sm">
        {Number(formatEther(s.rfxEarned)).toLocaleString()} RFX
      </div>
    </div>
  );
}
