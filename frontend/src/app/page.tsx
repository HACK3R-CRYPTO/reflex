"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, GAME_NAMES } from "@/lib/contracts";
import { ArenaPlatformABI, ReflexTokenABI } from "@/lib/abis";
import { watchArenaEvents, type MatchEvent } from "@/lib/reactivity";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Home() {
  const [liveFeed, setLiveFeed] = useState<MatchEvent[]>([]);

  const { data: matchCount } = useReadContract({
    address: CONTRACTS.arenaPlatform,
    abi: ArenaPlatformABI,
    functionName: "matchCount",
  });

  const { data: rewardPool } = useReadContract({
    address: CONTRACTS.arenaPlatform,
    abi: ArenaPlatformABI,
    functionName: "soloRewardPool",
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.reflexToken,
    abi: ReflexTokenABI,
    functionName: "totalSupply",
  });

  useEffect(() => {
    const unwatch = watchArenaEvents((event) => {
      setLiveFeed((prev) => [event, ...prev].slice(0, 20));
    });
    return () => { unwatch(); };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            The Chain Reacts. You Play.
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Real-time on-chain gaming powered by Somnia Reactivity.
            Every score, every match, every rank change — pushed to your screen instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/play"
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-lg transition-colors"
            >
              Start Playing
            </Link>
            <Link
              href="/arena"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-lg transition-colors border border-white/20"
            >
              Enter Arena
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Total Matches</p>
            <p className="text-3xl font-bold text-violet-400 mt-1">
              {matchCount ? matchCount.toString() : "0"}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Solo Reward Pool</p>
            <p className="text-3xl font-bold text-cyan-400 mt-1">
              {rewardPool ? `${Number(formatEther(rewardPool)).toLocaleString()} RFX` : "Loading..."}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-sm text-gray-500 uppercase tracking-wide">RFX Total Supply</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">
              {totalSupply ? `${Number(formatEther(totalSupply)).toLocaleString()}` : "Loading..."}
            </p>
          </div>
        </div>
      </section>

      {/* Live Feed */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live Feed
        </h2>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {liveFeed.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              Waiting for live events from Somnia Reactivity...
            </p>
          ) : (
            <div className="divide-y divide-gray-800">
              {liveFeed.map((event, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      event.type === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                      event.type === "proposed" ? "bg-violet-500/20 text-violet-400" :
                      event.type === "accepted" ? "bg-cyan-500/20 text-cyan-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {event.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-300">
                      Match #{event.matchId.toString()}
                      {event.gameType !== undefined && ` - ${GAME_NAMES[event.gameType] || "Unknown"}`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.winner && `Winner: ${shortenAddress(event.winner)}`}
                    {event.player1 && !event.winner && shortenAddress(event.player1)}
                    {event.wager && ` | ${formatEther(event.wager)} RFX`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 py-16 pb-24">
        <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Connect", desc: "Connect your wallet to Somnia Testnet" },
            { step: "2", title: "Swap", desc: "Swap SOMNI for RFX tokens" },
            { step: "3", title: "Mint Pass", desc: "Mint your Reflex Pass NFT" },
            { step: "4", title: "Play", desc: "Solo games or PvP arena battles" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {step}
              </div>
              <h3 className="font-semibold text-lg mb-1">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
