"use client";
import { useMatchFeed } from "../lib/useReactivity";
import { CONTRACTS, NEXUS_ADDRESS, ARENA_ABI, GAME_TYPES } from "../lib/contracts";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Link from "next/link";

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    proposed:  "badge-yellow",
    active:    "badge-green",
    completed: "badge-gray",
  };
  return <span className={`status-badge ${styles[status] ?? "badge-gray"}`}>{status}</span>;
}

// ─── NEXUS Agent Panel ────────────────────────────────────────────────────────
function NexusPanel({ matches }: { matches: ReturnType<typeof useMatchFeed>["matches"] }) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    // Check if NEXUS agent has any recent activity (proposed/active match in last 5 min)
    const recentActivity = matches.some(
      (m) =>
        (m.challenger.toLowerCase() === NEXUS_ADDRESS.toLowerCase() ||
          m.opponent.toLowerCase() === NEXUS_ADDRESS.toLowerCase()) &&
        (m.status === "proposed" || m.status === "active")
    );
    setOnline(recentActivity || true); // NEXUS is always listening
  }, [matches]);

  const nexusMatches = matches.filter(
    (m) =>
      m.challenger.toLowerCase() === NEXUS_ADDRESS.toLowerCase() ||
      m.opponent.toLowerCase() === NEXUS_ADDRESS.toLowerCase()
  );
  const activeNexusMatches = nexusMatches.filter((m) => m.status === "active");

  return (
    <div className="nexus-panel">
      <div className="nexus-header">
        <span className="nexus-icon">🤖</span>
        <div>
          <div className="nexus-name">NEXUS AI</div>
          <div className={`nexus-status ${online ? "nexus-status--online" : ""}`}>
            <span className="nexus-dot" /> {online ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      <div className="nexus-stats">
        <div className="nexus-stat">
          <span className="nexus-stat-val">{activeNexusMatches.length}</span>
          <span className="nexus-stat-label">Active Matches</span>
        </div>
        <div className="nexus-stat">
          <span className="nexus-stat-val">{nexusMatches.length}</span>
          <span className="nexus-stat-label">Recent</span>
        </div>
      </div>

      <div className="nexus-strategy">
        <div className="nexus-section-label">Strategy</div>
        <div className="nexus-strategy-name">Nash Equilibrium</div>
        <div className="nexus-strategy-desc">
          Provably optimal mixed strategy. 50/50 expected value against any opponent.
        </div>
      </div>

      <div className="nexus-games">
        <div className="nexus-section-label">Supported Games</div>
        {GAME_TYPES.map((g) => (
          <span key={g} className="game-tag">{g}</span>
        ))}
      </div>

      <div className="nexus-addr">
        <div className="nexus-section-label">Contract Address</div>
        <div className="nexus-addr-val">{NEXUS_ADDRESS}</div>
      </div>
    </div>
  );
}

// ─── Arena Page ───────────────────────────────────────────────────────────────
export default function ArenaPage() {
  const { matches, loading } = useMatchFeed();
  const [challenging, setChallenging] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function challengeNexus() {
    setError(null);
    setTxHash(null);
    // @ts-expect-error ethereum injected
    if (!window.ethereum) { setError("No wallet found. Install MetaMask."); return; }
    try {
      setChallenging(true);
      // @ts-expect-error ethereum injected
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 50312) {
        setError("Switch to Somnia Testnet (chain ID 50312) first.");
        return;
      }

      const arena = new ethers.Contract(CONTRACTS.ARENA_PLATFORM, ARENA_ABI, signer);
      const tx = await arena.proposeMatch(NEXUS_ADDRESS, 0n, 0);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e: unknown) {
      setError((e as Error).message?.slice(0, 140) ?? "Transaction failed");
    } finally {
      setChallenging(false);
    }
  }

  const openMatches = matches.filter((m) => m.status === "proposed");
  const activeMatches = matches.filter((m) => m.status === "active");
  const completedMatches = matches.filter((m) => m.status === "completed");

  return (
    <main className="page arena-page">
      {/* Left: Feed + CTA */}
      <div className="arena-main">
        <div className="page-header">
          <h1>PvP Arena</h1>
          <p className="subtitle">
            Live match stream via{" "}
            <span className="badge-cyan">Somnia Reactivity</span>
            {!loading && (
              <span style={{ marginLeft: 12, color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
                {openMatches.length} open · {activeMatches.length} active · {completedMatches.length} completed
              </span>
            )}
          </p>
        </div>

        {/* CTA */}
        <div className="arena-cta">
          <button className="btn btn-glow" onClick={challengeNexus} disabled={challenging}>
            {challenging ? "⏳ Proposing…" : "⚔️ Challenge NEXUS AI"}
          </button>
          {txHash && (
            <p className="tx-success">
              ✅ Match proposed!{" "}
              <a
                href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
                target="_blank" rel="noreferrer" className="tx-link"
              >
                View TX ↗
              </a>
            </p>
          )}
          {error && <p className="tx-error">❌ {error}</p>}
        </div>

        {/* Live Feed */}
        <div className="feed-header">
          <h2>Live Match Feed</h2>
          <span className="live-badge">● LIVE</span>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><p>Syncing matches…</p></div>
        ) : matches.length === 0 ? (
          <div className="empty-state"><p>No recent matches. Be the first to fight!</p></div>
        ) : (
          <div className="match-list">
            {matches.map((m) => (
              <Link key={m.matchId} href={`/arena/${m.matchId}`} className={`match-card match-card--${m.status}`}>
                <div className="match-id">#{m.matchId}</div>
                <div className="match-players">
                  <span className="challenger">
                    {m.challenger.toLowerCase() === NEXUS_ADDRESS.toLowerCase() ? "🤖 NEXUS" : shortAddr(m.challenger)}
                  </span>
                  <span className="vs">VS</span>
                  <span className="opponent">
                    {m.opponent.toLowerCase() === NEXUS_ADDRESS.toLowerCase()
                      ? "🤖 NEXUS"
                      : m.opponent === "0x0000000000000000000000000000000000000000"
                      ? "Open"
                      : shortAddr(m.opponent)}
                  </span>
                </div>
                <div className="match-meta">
                  <span className="game-type">{m.gameType}</span>
                  <span className="wager">{m.wager > 0n ? `${ethers.formatEther(m.wager)} RFX` : "Free"}</span>
                  <StatusBadge status={m.status} />
                </div>
                {m.status === "completed" && m.winner && (
                  <div className="match-result">
                    🏆 {m.winner.toLowerCase() === NEXUS_ADDRESS.toLowerCase() ? "🤖 NEXUS" : shortAddr(m.winner)}
                    {m.prize && m.prize > 0n ? ` · ${ethers.formatEther(m.prize)} RFX` : ""}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right: NEXUS Panel */}
      <aside className="arena-sidebar">
        <NexusPanel matches={matches} />
      </aside>
    </main>
  );
}
