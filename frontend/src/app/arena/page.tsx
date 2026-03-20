"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther, decodeEventLog } from "viem";
import { CONTRACTS, GameType, GAME_NAMES } from "@/lib/contracts";
import { ArenaPlatformABI, ReflexTokenABI } from "@/lib/abis";
import { watchArenaEvents, type MatchEvent } from "@/lib/reactivity";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ArenaPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [selectedGame, setSelectedGame] = useState<GameType>(GameType.RockPaperScissors);
  const [wagerAmount, setWagerAmount] = useState("10");
  const [selectedMove, setSelectedMove] = useState(0);
  const [liveFeed, setLiveFeed] = useState<MatchEvent[]>([]);

  const { data: matchCount } = useReadContract({
    address: CONTRACTS.arenaPlatform,
    abi: ArenaPlatformABI,
    functionName: "matchCount",
  });

  const { writeContract: approveRfx, data: approveHash } = useWriteContract();
  const { writeContract: playAgainstAI, data: playHash } = useWriteContract();

  const { isLoading: approveLoading, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: playLoading, isSuccess: playSuccess, data: playReceipt } = useWaitForTransactionReceipt({ hash: playHash });

  useEffect(() => {
    if (playReceipt && playReceipt.logs.length > 0) {
      try {
        for (const log of playReceipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: ArenaPlatformABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "PlayerMoved") {
              const matchId = (decoded.args as { matchId: bigint }).matchId;
              router.push(`/arena/${matchId.toString()}`);
            }
          } catch {}
        }
      } catch {}
    }
  }, [playReceipt, router]);

  useEffect(() => {
    const unwatch = watchArenaEvents((event) => {
      setLiveFeed((prev) => [event, ...prev].slice(0, 30));
    });
    return () => { unwatch(); };
  }, []);

  const handleApprove = () => {
    approveRfx({
      address: CONTRACTS.reflexToken,
      abi: ReflexTokenABI,
      functionName: "approve",
      args: [CONTRACTS.arenaPlatform, parseEther("999999999")],
    });
  };

  const handlePlay = () => {
    playAgainstAI({
      address: CONTRACTS.arenaPlatform,
      abi: ArenaPlatformABI,
      functionName: "playAgainstAI",
      args: [selectedGame, parseEther(wagerAmount), selectedMove],
    });
  };

  const getMoveOptions = () => {
    switch (selectedGame) {
      case GameType.RockPaperScissors: return ["Rock", "Paper", "Scissors"];
      case GameType.DiceRoll: return ["1", "2", "3", "4", "5", "6"];
      case GameType.StrategyBattle: return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      case GameType.CoinFlip: return ["Heads", "Tails"];
      default: return [];
    }
  };

  const recentMatchIds = matchCount ? Array.from({ length: Math.min(Number(matchCount), 10) }, (_, i) => Number(matchCount) - i) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 relative">
      <div className="mb-12">
        <h1 className="text-5xl font-black mb-4 tracking-tight text-gradient-violet">
          PvP Arena
        </h1>
        <p className="text-gray-400 max-w-2xl text-lg leading-relaxed">
          Challenge the NEXUS AI in a high-speed, on-chain duel. Powered by Somnia's 
          <span className="text-cyan-400 font-semibold mx-1">Native Reactivity</span> 
          for sub-second, provably fair resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Match Creation Panel */}
        <div className="lg:col-span-5">
          <div className="glass rounded-3xl p-8 sticky top-24 shadow-2xl overflow-hidden shimmer">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Initialize Match</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Select Battle Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(GAME_NAMES).map(([key, name]) => (
                    <button 
                      key={key} 
                      onClick={() => { setSelectedGame(Number(key) as GameType); setSelectedMove(0); }} 
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border ${selectedGame === Number(key) ? "bg-violet-600/20 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {getMoveOptions().length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Your Move</label>
                  <div className="flex flex-wrap gap-3">
                    {getMoveOptions().map((move, i) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedMove(selectedGame === GameType.DiceRoll ? i + 1 : i)} 
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border ${selectedMove === (selectedGame === GameType.DiceRoll ? i + 1 : i) ? "bg-cyan-600/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}
                      >
                        {move}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Stake (RFX)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={wagerAmount} 
                    onChange={(e) => setWagerAmount(e.target.value)} 
                    className="w-full bg-white/5 rounded-xl px-4 py-4 text-white border border-white/10 focus:border-violet-500 outline-none transition-all font-mono text-lg" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase">RFX</div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                {!approveSuccess && (
                  <button 
                    onClick={handleApprove} 
                    disabled={approveLoading} 
                    className="w-full px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {approveLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    {approveLoading ? "Granting Permission..." : "Authorize RFX"}
                  </button>
                )}
                
                <button 
                  onClick={handlePlay} 
                  disabled={playLoading || !address || !approveSuccess} 
                  className="w-full px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl font-black text-lg transition-all shadow-xl shadow-violet-900/20 disabled:opacity-30 disabled:grayscale relative group overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {playLoading && <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />}
                    {playLoading ? "STRIKING ON-CHAIN..." : "CHALLENGE NEXUS AI"}
                  </div>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed Panel */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span className="flex relative items-center justify-center">
                <span className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
                <span className="relative w-3 h-3 bg-emerald-500 rounded-full" />
              </span>
              Battle Log
            </h3>
            <span className="text-[10px] bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-500 font-mono uppercase tracking-widest">
              Live from Somnia
            </span>
          </div>

          <div className="glass rounded-3xl border-white/5 overflow-hidden min-h-[500px]">
            {liveFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-gray-500 space-y-4">
                <div className="w-12 h-12 border-2 border-white/10 border-dashed rounded-full animate-spin" />
                <p className="font-medium">Establishing connection to Somnia Reactivity...</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {liveFeed.map((event, i) => (
                  <Link key={i} href={`/arena/${event.matchId.toString()}`} className="group p-6 flex items-center justify-between hover:bg-white/[0.03] transition-all relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                        event.type === "completed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : 
                        event.type === "draw" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : 
                        "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      }`}>
                        {event.gameType === GameType.RockPaperScissors && "🪨"}
                        {event.gameType === GameType.DiceRoll && "🎲"}
                        {event.gameType === GameType.StrategyBattle && "🛡️"}
                        {event.gameType === GameType.CoinFlip && "🪙"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">Match #{event.matchId.toString()}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                            event.type === "completed" ? "bg-emerald-500/20 text-emerald-400" : 
                            event.type === "draw" ? "bg-yellow-500/20 text-yellow-400" : 
                            "bg-cyan-500/20 text-cyan-400"
                          }`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {event.winner ? `Victor: ${shortenAddress(event.winner)}` : `Staked: ${formatEther(event.wager || 0n)} RFX`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-600 font-mono uppercase">Status</p>
                        <p className={`text-xs font-bold ${event.type === "completed" ? "text-emerald-500" : "text-cyan-500"}`}>
                          {event.type === "completed" ? "RESOLVED" : "ACTIVE"}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors border border-white/10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                    <div className="absolute left-0 top-0 w-1 h-full bg-violet-600 -translate-x-1 group-hover:translate-x-0 transition-transform" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
