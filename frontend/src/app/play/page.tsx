"use client";

import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { useState } from "react";
import { CONTRACTS } from "@/lib/contracts";
import { ReflexTokenABI, ReflexSwapABI, ReflexPassABI } from "@/lib/abis";

export default function PlayPage() {
  const { address, isConnected } = useAccount();
  const [swapAmount, setSwapAmount] = useState("0.1");

  const { data: rfxBalance } = useReadContract({
    address: CONTRACTS.reflexToken,
    abi: ReflexTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: hasPass } = useReadContract({
    address: CONTRACTS.reflexPass,
    abi: ReflexPassABI,
    functionName: "hasPass",
    args: address ? [address] : undefined,
  });

  const { writeContract: swap, data: swapHash } = useWriteContract();
  const { writeContract: approveRfx, data: approveHash } = useWriteContract();
  const { writeContract: mintPass, data: mintHash } = useWriteContract();

  const { isLoading: swapLoading } = useWaitForTransactionReceipt({ hash: swapHash });
  const { isLoading: approveLoading } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: mintLoading } = useWaitForTransactionReceipt({ hash: mintHash });

  const handleSwap = () => {
    swap({
      address: CONTRACTS.reflexSwap,
      abi: ReflexSwapABI,
      functionName: "swap",
      value: parseEther(swapAmount),
      gas: 300_000n,
    });
  };

  const handleMintPass = async () => {
    approveRfx({
      address: CONTRACTS.reflexToken,
      abi: ReflexTokenABI,
      functionName: "approve",
      args: [CONTRACTS.reflexPass, parseEther("100")],
      gas: 300_000n,
    });
  };

  const handleMint = () => {
    mintPass({
      address: CONTRACTS.reflexPass,
      abi: ReflexPassABI,
      functionName: "mint",
      gas: 500_000n,
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-400">Connect your wallet to start playing on Reflex.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Play</h1>
      <p className="text-gray-400 mb-8">Earn RFX in solo games or wager in PvP battles.</p>

      {/* Onboarding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Swap */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-1">Swap SOMNI to RFX</h3>
          <p className="text-sm text-gray-500 mb-4">1 SOMNI = 1,000 RFX</p>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white border border-gray-700 focus:border-violet-500 outline-none"
              placeholder="SOMNI amount"
              step="0.01"
            />
            <button
              onClick={handleSwap}
              disabled={swapLoading}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {swapLoading ? "Swapping..." : "Swap"}
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Balance: {rfxBalance ? `${Number(formatEther(rfxBalance)).toLocaleString()} RFX` : "0 RFX"}
          </p>
        </div>

        {/* Mint Pass */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-1">Reflex Pass</h3>
          <p className="text-sm text-gray-500 mb-4">Your NFT platform key (100 RFX)</p>
          {hasPass ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <p className="text-emerald-400 font-semibold">Pass Active</p>
              <p className="text-sm text-gray-400 mt-1">You have full platform access.</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleMintPass}
                disabled={approveLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {approveLoading ? "Approving..." : "1. Approve RFX"}
              </button>
              <button
                onClick={handleMint}
                disabled={mintLoading}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {mintLoading ? "Minting..." : "2. Mint Pass"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Game Modes */}
      <h2 className="text-2xl font-bold mb-6">Solo Games — Earn RFX</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/play/rhythm" className="group">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-violet-500/50 transition-all group-hover:shadow-lg group-hover:shadow-violet-500/10">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-bold mb-2">Rhythm Game</h3>
            <p className="text-gray-400 text-sm">
              Tap buttons in sync with beats. Build combos up to 50x for maximum RFX rewards.
            </p>
            <p className="text-violet-400 text-sm mt-3 font-medium">Play Now &rarr;</p>
          </div>
        </Link>
        <Link href="/play/memory" className="group">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-cyan-500/50 transition-all group-hover:shadow-lg group-hover:shadow-cyan-500/10">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-2">Memory Game</h3>
            <p className="text-gray-400 text-sm">
              Repeat flashing sequences. Longer chains and faster reactions mean higher scores.
            </p>
            <p className="text-cyan-400 text-sm mt-3 font-medium">Play Now &rarr;</p>
          </div>
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-6">PvP Arena — Wager RFX</h2>
      <Link href="/arena" className="group block">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-emerald-500/50 transition-all group-hover:shadow-lg group-hover:shadow-emerald-500/10">
          <div className="text-4xl mb-4">&#9876;</div>
          <h3 className="text-xl font-bold mb-2">Enter the Arena</h3>
          <p className="text-gray-400 text-sm">
            Challenge NEXUS AI in real-time. Rock-Paper-Scissors, Dice Roll, Strategy Battle, Coin Flip, and Tic-Tac-Toe.
            Powered by Somnia Native Reactivity — instant, fair, on-chain resolution.
          </p>
          <p className="text-emerald-400 text-sm mt-3 font-medium">Go to Arena &rarr;</p>
        </div>
      </Link>
    </div>
  );
}
