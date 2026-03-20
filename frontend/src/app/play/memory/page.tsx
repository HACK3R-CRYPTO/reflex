"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";

const GRID_SIZE = 9;
const COLORS_MAP = [
  "bg-rose-500", "bg-blue-500", "bg-emerald-500",
  "bg-amber-500", "bg-violet-500", "bg-cyan-500",
  "bg-pink-500", "bg-lime-500", "bg-orange-500",
];
const SCORE_VALIDATOR_URL = process.env.NEXT_PUBLIC_SCORE_VALIDATOR_URL || "http://localhost:3001";

export default function MemoryGame() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [gameState, setGameState] = useState<"idle" | "showing" | "input" | "ended">("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const startTimeRef = useRef(0);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setSubmitResult(null);
    nextRound([]);
  };

  const nextRound = (prevSeq: number[]) => {
    const newSeq = [...prevSeq, Math.floor(Math.random() * GRID_SIZE)];
    setSequence(newSeq);
    setPlayerInput([]);
    setGameState("showing");
    showSequence(newSeq);
  };

  const showSequence = (seq: number[]) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        setActiveCell(seq[i]);
        setTimeout(() => setActiveCell(null), 400);
        i++;
      } else {
        clearInterval(interval);
        setGameState("input");
        startTimeRef.current = Date.now();
      }
    }, 600);
  };

  const handleCellClick = (index: number) => {
    if (gameState !== "input") return;

    const newInput = [...playerInput, index];
    setPlayerInput(newInput);

    // Flash
    setActiveCell(index);
    setTimeout(() => setActiveCell(null), 200);

    const step = newInput.length - 1;

    if (newInput[step] !== sequence[step]) {
      // Wrong
      setGameState("ended");
      return;
    }

    if (newInput.length === sequence.length) {
      // Correct! Calculate score
      const elapsed = Date.now() - startTimeRef.current;
      const speedBonus = Math.max(0, 5000 - elapsed) / 100;
      const levelPoints = sequence.length * 100 + Math.floor(speedBonus) * 10;
      setScore((s) => s + levelPoints);
      setLevel((l) => l + 1);

      setTimeout(() => nextRound(sequence), 500);
    }
  };

  const submitScore = async () => {
    if (!address || submitting) return;
    setSubmitting(true);
    try {
      const nonce = crypto.randomUUID();
      const message = `REFLEX:${address}:${score}:1:${nonce}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch(`${SCORE_VALIDATOR_URL}/submit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: address,
          score,
          gameType: 1,
          timestamp: Date.now(),
          duration: 5000,
          signature,
          nonce,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitResult(`Score submitted! TX: ${data.txHash.slice(0, 10)}...`);
      } else {
        setSubmitResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setSubmitResult(`Error: ${err.message}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Memory Game</h1>
      <p className="text-gray-400 mb-8 text-sm">Watch the sequence, then repeat it.</p>

      {gameState === "idle" && (
        <div className="text-center py-16">
          <button
            onClick={startGame}
            className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xl font-bold transition-colors"
          >
            Start Game
          </button>
          <p className="text-gray-500 mt-4 text-sm">Remember and repeat the flashing pattern.</p>
        </div>
      )}

      {(gameState === "showing" || gameState === "input") && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-2xl font-bold text-cyan-400">{score.toLocaleString()}</span>
              <span className="text-gray-500 ml-2">pts</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-violet-400">Level {level}</span>
              <span className="text-gray-500 ml-2">({sequence.length} tiles)</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mb-4">
            {gameState === "showing" ? "Watch carefully..." : "Your turn! Tap the sequence."}
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={gameState !== "input"}
                className={`aspect-square rounded-xl transition-all duration-200 border-2 ${
                  activeCell === i
                    ? `${COLORS_MAP[i]} border-white scale-95`
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                } ${gameState === "input" ? "cursor-pointer" : "cursor-default"}`}
              />
            ))}
          </div>
        </>
      )}

      {gameState === "ended" && (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <h2 className="text-3xl font-bold mb-2">Game Over</h2>
          <p className="text-5xl font-black text-cyan-400 mb-2">{score.toLocaleString()}</p>
          <p className="text-gray-400 mb-6">Reached Level {level} ({sequence.length - 1} tiles)</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition-colors"
            >
              Play Again
            </button>
            {address && (
              <button
                onClick={submitScore}
                disabled={submitting}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Score"}
              </button>
            )}
          </div>
          {submitResult && (
            <p className={`mt-4 text-sm ${submitResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {submitResult}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
