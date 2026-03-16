"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { CONTRACTS, ARENA_ABI, NEXUS_ADDRESS, SOMNIA_RPC, GAME_TYPES } from "../../lib/contracts";
import Link from "next/link";

const EXTENDED_ARENA_ABI = [
  ...ARENA_ABI,
  "function matches(uint256 matchId) external view returns (address challenger, address opponent, uint256 wager, uint8 gameType, uint8 state, address winner)",
];

interface MatchDetail {
  matchId: number;
  challenger: string;
  opponent: string;
  wager: bigint;
  gameType: string;
  state: number; // 0=proposed, 1=active, 2=completed, 3=cancelled
  winner: string;
}

const STATE_LABEL: Record<number, string> = {
  0: "proposed",
  1: "active",
  2: "completed",
  3: "cancelled",
};
const STATE_CLASS: Record<number, string> = {
  0: "badge-yellow",
  1: "badge-green",
  2: "badge-gray",
  3: "badge-gray",
};

function shortAddr(addr: string) {
  return addr === "0x0000000000000000000000000000000000000000"
    ? "Open Challenge"
    : addr.slice(0, 8) + "…" + addr.slice(-6);
}

function isNexus(addr: string) {
  return addr.toLowerCase() === NEXUS_ADDRESS.toLowerCase();
}

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const load = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(SOMNIA_RPC);
        const arena = new ethers.Contract(CONTRACTS.ARENA_PLATFORM, EXTENDED_ARENA_ABI, provider);

        const m = await arena.matches(BigInt(matchId));
        setMatch({
          matchId: Number(matchId),
          challenger: m[0],
          opponent: m[1],
          wager: m[2] as bigint,
          gameType: GAME_TYPES[Number(m[3])] ?? "RPS",
          state: Number(m[4]),
          winner: m[5],
        });
      } catch (e) {
        setError("Match not found or RPC error.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();

    // Poll for state updates if active
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) return (
    <main className="page">
      <div className="loading-state"><div className="spinner" /><p>Loading match…</p></div>
    </main>
  );

  if (error || !match) return (
    <main className="page">
      <div className="empty-state">
        <p>{error ?? "Match not found"}</p>
        <Link href="/arena" className="btn">← Back to Arena</Link>
      </div>
    </main>
  );

  const stateLabel = STATE_LABEL[match.state] ?? "unknown";
  const stateClass = STATE_CLASS[match.state] ?? "badge-gray";
  const isCompleted = match.state === 2;
  const isTie = isCompleted && match.winner === "0x0000000000000000000000000000000000000000";

  return (
    <main className="page">
      <Link href="/arena" className="back-link">← Arena</Link>

      <div className="page-header" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1>Match #{match.matchId}</h1>
          <span className={`status-badge ${stateClass}`}>{stateLabel}</span>
        </div>
        <p className="subtitle">{match.gameType}</p>
      </div>

      <div className="match-detail-grid">
        <div className="match-detail-card">
          <div className="detail-label">Challenger</div>
          <div className="detail-addr">
            {isNexus(match.challenger) ? "🤖 NEXUS AI" : shortAddr(match.challenger)}
          </div>
          {isCompleted && match.winner === match.challenger && (
            <div className="winner-badge">🏆 Winner</div>
          )}
        </div>

        <div className="vs-divider">VS</div>

        <div className="match-detail-card">
          <div className="detail-label">Opponent</div>
          <div className="detail-addr">
            {isNexus(match.opponent) ? "🤖 NEXUS AI" : shortAddr(match.opponent)}
          </div>
          {isCompleted && match.winner === match.opponent && (
            <div className="winner-badge">🏆 Winner</div>
          )}
        </div>
      </div>

      <div className="match-info-row">
        <div className="info-chip">
          <span className="info-label">Wager</span>
          <span className="info-value">
            {match.wager > 0n ? `${ethers.formatEther(match.wager)} RFX` : "Free match"}
          </span>
        </div>
        <div className="info-chip">
          <span className="info-label">Game</span>
          <span className="info-value">{match.gameType}</span>
        </div>
      </div>

      {isCompleted && (
        <div className="match-result-banner">
          {isTie ? (
            <div className="result-tie">🤝 Match ended in a TIE</div>
          ) : (
            <div className="result-win">
              🏆 Winner:{" "}
              <strong>
                {isNexus(match.winner) ? "🤖 NEXUS AI" : shortAddr(match.winner)}
              </strong>
            </div>
          )}
          <p className="result-note">
            Leaderboard updated on-chain via{" "}
            <span className="badge-cyan">Somnia Reactivity</span>
          </p>
        </div>
      )}

      {match.state === 0 && (
        <div className="match-waiting">
          <div className="spinner" />
          <p>Waiting for opponent to accept…</p>
        </div>
      )}
      {match.state === 1 && (
        <div className="match-waiting">
          <div className="spinner" style={{ borderTopColor: "var(--green)" }} />
          <p>Match in progress — commit-reveal active</p>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <Link href="/leaderboard" className="btn">View Leaderboard →</Link>
      </div>
    </main>
  );
}
