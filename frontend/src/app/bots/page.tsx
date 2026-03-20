"use client";

import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { AgentRegistryABI } from "@/lib/abis";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function BotsPage() {
  const { data: agentCount } = useReadContract({
    address: CONTRACTS.agentRegistry,
    abi: AgentRegistryABI,
    functionName: "getAgentCount",
  });

  const count = agentCount ? Number(agentCount) : 0;
  const indices = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Bot Registry</h1>
      <p className="text-gray-400 mb-8">
        AI opponents registered on-chain. Challenge them in the Arena.
      </p>

      <div className="space-y-4">
        {indices.map((i) => (
          <BotCard key={i} index={i} />
        ))}
        {count === 0 && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-gray-500">No bots registered yet.</p>
          </div>
        )}
      </div>

      {/* Bot SDK Promo */}
      <div className="mt-12 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-2xl p-8 border border-violet-500/20">
        <h2 className="text-xl font-bold mb-2">Build Your Own Bot</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Anyone can register a bot on Reflex. Write your strategy, register on-chain,
          and let the community challenge it.
        </p>
        <p className="text-sm text-gray-500">
          Check out the <span className="text-violet-400 font-medium">BOT_STARTER_KIT.md</span> in the agent folder for the full guide.
        </p>
      </div>
    </div>
  );
}

function BotCard({ index }: { index: number }) {
  const { data: agentAddr } = useReadContract({
    address: CONTRACTS.agentRegistry,
    abi: AgentRegistryABI,
    functionName: "agentList",
    args: [BigInt(index)],
  });

  const { data: agent } = useReadContract({
    address: CONTRACTS.agentRegistry,
    abi: AgentRegistryABI,
    functionName: "getAgent",
    args: agentAddr ? [agentAddr as `0x${string}`] : undefined,
  });

  if (!agent) return null;

  const a = agent as {
    wallet: string; name: string; strategy: string; isOfficial: boolean;
    active: boolean; wins: bigint; losses: bigint; draws: bigint;
  };

  const totalGames = Number(a.wins) + Number(a.losses) + Number(a.draws);
  const winRate = totalGames > 0 ? ((Number(a.wins) / totalGames) * 100).toFixed(1) : "N/A";

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{a.name}</h3>
            {a.isOfficial && (
              <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded font-medium">
                OFFICIAL
              </span>
            )}
            {!a.active && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-medium">
                INACTIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-mono mt-1">{shortenAddress(a.wallet)}</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-4">{a.strategy}</p>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500">Wins</p>
          <p className="text-lg font-bold text-emerald-400">{a.wins.toString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Losses</p>
          <p className="text-lg font-bold text-red-400">{a.losses.toString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Draws</p>
          <p className="text-lg font-bold text-gray-400">{a.draws.toString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Win Rate</p>
          <p className="text-lg font-bold text-cyan-400">{winRate}%</p>
        </div>
      </div>
    </div>
  );
}
