"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";

const KEYS = ["D", "F", "J", "K"];
const COLORS = ["bg-rose-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500"];
const BPM = 120;
const BEAT_INTERVAL = 60000 / BPM;
const SCORE_VALIDATOR_URL = process.env.NEXT_PUBLIC_SCORE_VALIDATOR_URL || "http://localhost:3001";

type Note = {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  missed: boolean;
};

export default function RhythmGame() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const noteIdRef = useRef(0);
  const startTimeRef = useRef(0);
  const gameLoopRef = useRef<number>(0);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval>>(null);

  const HIT_ZONE_Y = 85; // percentage from top
  const HIT_TOLERANCE = 8;

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setNotes([]);
    setFeedback(null);
    setSubmitResult(null);
    noteIdRef.current = 0;
    startTimeRef.current = Date.now();

    // Spawn notes on beat
    spawnTimerRef.current = setInterval(() => {
      const lane = Math.floor(Math.random() * 4);
      setNotes((prev) => [
        ...prev,
        { id: noteIdRef.current++, lane, y: -5, hit: false, missed: false },
      ]);
    }, BEAT_INTERVAL);

    // End after 30 seconds
    setTimeout(() => endGame(), 30000);
  };

  const endGame = useCallback(() => {
    setGameState("ended");
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  // Game loop — move notes down
  useEffect(() => {
    if (gameState !== "playing") return;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setNotes((prev) => {
        const updated = prev.map((n) => ({
          ...n,
          y: n.y + dt * 45, // speed: 45% per second
        }));

        // Check misses
        for (const n of updated) {
          if (!n.hit && !n.missed && n.y > HIT_ZONE_Y + HIT_TOLERANCE) {
            n.missed = true;
          }
        }

        // Reset combo on miss
        const anyNewMiss = updated.some((n) => n.missed && prev.find((p) => p.id === n.id && !p.missed));
        if (anyNewMiss) {
          setCombo(0);
          setFeedback("MISS");
          setTimeout(() => setFeedback(null), 300);
        }

        return updated.filter((n) => n.y < 110);
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState]);

  const handleKeyPress = useCallback(
    (lane: number) => {
      if (gameState !== "playing") return;

      setNotes((prev) => {
        const hittable = prev
          .filter((n) => n.lane === lane && !n.hit && !n.missed)
          .sort((a, b) => Math.abs(a.y - HIT_ZONE_Y) - Math.abs(b.y - HIT_ZONE_Y));

        if (hittable.length === 0) return prev;
        const closest = hittable[0];
        const dist = Math.abs(closest.y - HIT_ZONE_Y);

        if (dist > HIT_TOLERANCE) return prev;

        const multiplier = Math.min(50, 1 + Math.floor((combo + 1) / 5));
        const points = dist < 3 ? 300 * multiplier : dist < 5 ? 200 * multiplier : 100 * multiplier;
        const rating = dist < 3 ? "PERFECT" : dist < 5 ? "GREAT" : "OK";

        setScore((s) => s + points);
        setCombo((c) => {
          const newCombo = c + 1;
          setMaxCombo((m) => Math.max(m, newCombo));
          return newCombo;
        });
        setFeedback(rating);
        setTimeout(() => setFeedback(null), 300);

        return prev.map((n) => (n.id === closest.id ? { ...n, hit: true } : n));
      });
    },
    [gameState, combo]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const idx = KEYS.indexOf(e.key.toUpperCase());
      if (idx >= 0) handleKeyPress(idx);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKeyPress]);

  const submitScore = async () => {
    if (!address || submitting) return;
    setSubmitting(true);
    try {
      const nonce = crypto.randomUUID();
      const message = `REFLEX:${address}:${score}:0:${nonce}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch(`${SCORE_VALIDATOR_URL}/submit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: address,
          score,
          gameType: 0,
          timestamp: Date.now(),
          duration: 30000,
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
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Rhythm Game</h1>
      <p className="text-gray-400 mb-8 text-sm">Press D, F, J, K in sync with the falling notes.</p>

      {gameState === "idle" && (
        <div className="text-center py-16">
          <button
            onClick={startGame}
            className="px-12 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl text-xl font-bold transition-colors"
          >
            Start Game
          </button>
          <p className="text-gray-500 mt-4 text-sm">30 seconds. Build combos for higher multipliers.</p>
        </div>
      )}

      {gameState === "playing" && (
        <>
          {/* Score Bar */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-2xl font-bold text-violet-400">{score.toLocaleString()}</span>
              <span className="text-gray-500 ml-2">pts</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-cyan-400">{combo}x</span>
              <span className="text-gray-500 ml-1">combo</span>
            </div>
          </div>

          {/* Game Area */}
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden" style={{ height: "500px" }}>
            {/* Lanes */}
            {KEYS.map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-r border-gray-800"
                style={{ left: `${i * 25}%`, width: "25%" }}
              />
            ))}

            {/* Hit Zone */}
            <div
              className="absolute left-0 right-0 h-2 bg-white/20"
              style={{ top: `${HIT_ZONE_Y}%` }}
            />

            {/* Notes */}
            {notes
              .filter((n) => !n.hit)
              .map((n) => (
                <div
                  key={n.id}
                  className={`absolute w-[20%] h-8 rounded-lg ${n.missed ? "opacity-30" : COLORS[n.lane]} transition-opacity`}
                  style={{
                    left: `${n.lane * 25 + 2.5}%`,
                    top: `${n.y}%`,
                  }}
                />
              ))}

            {/* Feedback */}
            {feedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span
                  className={`text-4xl font-black ${
                    feedback === "PERFECT" ? "text-emerald-400" :
                    feedback === "GREAT" ? "text-cyan-400" :
                    feedback === "OK" ? "text-yellow-400" :
                    "text-red-400"
                  }`}
                >
                  {feedback}
                </span>
              </div>
            )}

            {/* Key Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex">
              {KEYS.map((key, i) => (
                <button
                  key={key}
                  onMouseDown={() => handleKeyPress(i)}
                  className="flex-1 h-16 flex items-center justify-center text-2xl font-bold text-gray-500 hover:bg-white/5 active:bg-white/10 transition-colors border-t border-gray-800"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {gameState === "ended" && (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <h2 className="text-3xl font-bold mb-2">Game Over</h2>
          <p className="text-5xl font-black text-violet-400 mb-4">{score.toLocaleString()}</p>
          <p className="text-gray-400 mb-6">Max Combo: {maxCombo}x</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
            >
              Play Again
            </button>
            {address && (
              <button
                onClick={submitScore}
                disabled={submitting}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition-colors disabled:opacity-50"
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
