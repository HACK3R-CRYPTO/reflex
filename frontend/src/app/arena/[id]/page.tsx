"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, GAME_NAMES } from "@/lib/contracts";
import { ArenaPlatformABI } from "@/lib/abis";
import Link from "next/link";

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const MOVE_LABELS: Record<number, string[]> = {
  0: ["Rock", "Paper", "Scissors"],
  1: ["", "1", "2", "3", "4", "5", "6"],
  2: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  3: ["Heads", "Tails"],
};

export default function MatchPage() {
  const params = useParams();
  const matchIdString = params.id as string;
  const matchId = BigInt(matchIdString);
  const { address } = useAccount();

  const { data: match, refetch: refetchMatch } = useReadContract({
    address: CONTRACTS.arenaPlatform,
    abi: ArenaPlatformABI,
    functionName: "getMatch",
    args: [matchId],
  });

  // Auto-refresh match state until resolved
  useEffect(() => {
    if (match && (match as any)[6]) return; // match[6] is resolved bool

    const interval = setInterval(() => {
      refetchMatch();
    }, 1500);
    return () => clearInterval(interval);
  }, [match, refetchMatch]);

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="mesh-bg" />
        <p className="text-gray-400">Loading match #{matchId.toString()}...</p>
      </div>
    );
  }

  // Tuple mapping: player(0), gameType(1), wager(2), move(3), aiMove(4), winner(5), resolved(6), createdAt(7)
  const m = {
    player: (match as any)[0] as string,
    gameType: (match as any)[1] as number,
    wager: (match as any)[2] as bigint,
    move: (match as any)[3] as number,
    aiMove: (match as any)[4] as number,
    winner: (match as any)[5] as string,
    resolved: (match as any)[6] as boolean,
    createdAt: (match as any)[7] as bigint,
  };

  const isPlayer = address?.toLowerCase() === m.player.toLowerCase();
  const statusLabel = m.resolved ? "Completed" : "Awaiting AI...";

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/arena" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-4xl font-black tracking-tighter text-white">Match #{matchId.toString()}</h1>
          </div>
          <p className="text-gray-400 font-medium ml-8">
            <span className="text-violet-400">{GAME_NAMES[m.gameType]}</span> 
            <span className="mx-2">•</span> 
            <span className="font-mono">{formatEther(m.wager)} RFX Stake</span>
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl glass border-white/10 ${m.resolved ? "border-emerald-500/50" : "border-cyan-500/50"}`}>
          <span className={`w-2 h-2 rounded-full ${m.resolved ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]"}`} />
          <span className={`text-xs font-black uppercase tracking-widest ${m.resolved ? "text-emerald-400" : "text-cyan-400"}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Arena View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* User Card */}
        <div className={`glass rounded-3xl p-8 relative overflow-hidden transition-all duration-500 ${isPlayer ? "border-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.1)]" : "border-white/5"}`}>
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                👤
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Human Player</p>
                <p className="font-mono text-sm text-white/70">{shortenAddress(m.player)}</p>
              </div>
            </div>
            {isPlayer && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-3 py-1 rounded-full font-black tracking-widest border border-violet-500/30">YOU</span>}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500/5 blur-3xl rounded-full" />
            <div className="relative bg-white/5 rounded-2xl p-8 text-center border border-white/5">
              <p className="text-[10px] text-gray-500 mb-2 font-black uppercase tracking-widest">Chosen Move</p>
              <p className="text-4xl font-black text-white tracking-tighter">
                {MOVE_LABELS[m.gameType][m.move] || m.move}
              </p>
            </div>
          </div>
          {isPlayer && <div className="absolute left-0 top-0 w-1 h-full bg-violet-500" />}
        </div>

        {/* AI Card */}
        <div className={`glass rounded-3xl p-8 relative overflow-hidden transition-all duration-500 ${m.resolved ? "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.1)]" : "border-white/5 opacity-80"}`}>
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${m.resolved ? "bg-cyan-600/20 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-gray-600"}`}>
                🤖
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">NEXUS AGENT</p>
                <p className="font-mono text-xs text-cyan-400 font-bold tracking-widest">REACTIVE_LOOP_V2</p>
              </div>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full font-black tracking-widest border border-cyan-500/30">L2_NATIVE</span>
          </div>

          <div className="relative">
            {!m.resolved && <div className="absolute inset-0 bg-cyan-500/10 blur-2xl animate-pulse rounded-full" />}
            <div className={`relative bg-white/5 rounded-2xl p-8 text-center border border-white/10 transition-all duration-500 ${!m.resolved ? "scale-95" : "scale-100"}`}>
              <p className="text-[10px] text-gray-500 mb-2 font-black uppercase tracking-widest">AI Counter</p>
              <p className={`text-4xl font-black tracking-tighter ${m.resolved ? "text-white" : "text-white/20 blur-sm"}`}>
                {m.resolved ? (MOVE_LABELS[m.gameType][m.aiMove] || m.aiMove) : "???"}
              </p>
            </div>
          </div>
          <div className={`absolute left-0 top-0 w-1 h-full transition-all duration-500 ${m.resolved ? "bg-cyan-500" : "bg-white/10"}`} />
        </div>
      </div>

      {/* Result Layer */}
      {m.resolved && (
        <div className={`glass rounded-3xl p-10 text-center border-t-4 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 ${m.winner.toLowerCase() === address?.toLowerCase() ? "border-emerald-500/50" : "border-rose-500/50"}`}>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Battle Result</p>
          <h2 className={`text-7xl font-black mb-6 tracking-tighter ${m.winner.toLowerCase() === address?.toLowerCase() ? "text-emerald-400" : "text-rose-400"}`}>
            {m.winner.toLowerCase() === address?.toLowerCase() ? "VICTORY" : "DEFEAT"}
          </h2>
          
          <div className="max-w-md mx-auto mb-10">
            <p className="text-gray-300 text-lg leading-relaxed">
              {m.winner.toLowerCase() === address?.toLowerCase() ? 
                 `Incredible. You outmaneuvered the NEXUS AI and claimed a reward of ${formatEther(m.wager * 192n / 100n)} RFX!` : 
                 "The AI's reactive algorithm predicted this outcome. Better luck next deployment."}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-gray-500 uppercase font-black mb-1">Randomness Source</span>
              <span className="text-xs font-mono text-cyan-400">BLOCK_PREVRANDAO</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-gray-500 uppercase font-black mb-1">Finality</span>
              <span className="text-xs font-mono text-emerald-400">IMMUTABLE_ON_CHAIN</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 group cursor-help p-3 rounded-xl hover:bg-white/5 transition-all">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span className="text-sm font-bold text-gray-400">Reactivity Verified</span>
             </div>
             <a 
               href={`https://explorer.testnet.somnia.network/address/${CONTRACTS.arenaPlatform}`} 
               target="_blank" 
               className="px-6 py-2 rounded-full border border-violet-500/30 text-[10px] text-violet-400 hover:bg-violet-500/10 uppercase font-black tracking-[0.2em] transition-all"
             >
               View Settlement TX
             </a>
          </div>
        </div>
      )}

      {/* Reactive Loading */}
      {!m.resolved && (
        <div className="glass rounded-3xl p-16 text-center border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">STRIKING REACTIVITY...</h3>
            <p className="text-gray-500 max-w-xs text-sm">Somnia L2 is processing the reactive callback for NEXUS AI moves.</p>
          </div>
        </div>
      )}
    </div>
  );
}
