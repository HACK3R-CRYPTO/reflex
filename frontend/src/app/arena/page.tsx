"use client";
import { useMatchFeed } from "../lib/useReactivity";
import { CONTRACTS, NEXUS_ADDRESS, ARENA_ABI } from "../lib/contracts";
import { ethers } from "ethers";
import { useState } from "react";

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    proposed: "badge-yellow",
    active:   "badge-green",
    completed:"badge-gray",
  };
  return <span className={`status-badge ${styles[status] ?? "badge-gray"}`}>{status}</span>;
}

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

      // Check chain
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 50312) {
        setError("Switch to Somnia Testnet (chain ID 50312) in MetaMask.");
        return;
      }

      const arena = new ethers.Contract(CONTRACTS.ARENA_PLATFORM, ARENA_ABI, signer);
      // Propose match against NEXUS: 0 wager, game type 0 (RPS)
      const tx = await arena.proposeMatch(NEXUS_ADDRESS, 0n, 0);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e: unknown) {
      setError((e as Error).message?.slice(0, 120) ?? "Transaction failed");
    } finally {
      setChallenging(false);
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>PvP Arena</h1>
        <p className="subtitle">
          All matches streamed live via{" "}
          <span className="badge-cyan">Somnia Reactivity</span>
        </p>
      </div>

      {/* CTA */}
      <div className="arena-cta">
        <button
          className="btn btn-glow"
          onClick={challengeNexus}
          disabled={challenging}
        >
          {challenging ? "⏳ Proposing…" : "⚔️ Challenge NEXUS AI"}
        </button>
        {txHash && (
          <p className="tx-success">
            ✅ Match proposed!{" "}
            <a
              href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="tx-link"
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
        <div className="loading-state">
          <div className="spinner" />
          <p>Syncing matches…</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <p>No recent matches. Be the first to fight!</p>
        </div>
      ) : (
        <div className="match-list">
          {matches.map((m) => (
            <div key={m.matchId} className={`match-card match-card--${m.status}`}>
              <div className="match-id">#{m.matchId}</div>
              <div className="match-players">
                <span className="challenger">{shortAddr(m.challenger)}</span>
                <span className="vs">VS</span>
                <span className="opponent">
                  {m.opponent.toLowerCase() === NEXUS_ADDRESS.toLowerCase()
                    ? "🤖 NEXUS"
                    : m.opponent === "0x0000000000000000000000000000000000000000"
                    ? "Open Challenge"
                    : shortAddr(m.opponent)}
                </span>
              </div>
              <div className="match-meta">
                <span className="game-type">{m.gameType}</span>
                <span className="wager">
                  {m.wager > 0n ? `${ethers.formatEther(m.wager)} RFX` : "Free"}
                </span>
                <StatusBadge status={m.status} />
              </div>
              {m.status === "completed" && m.winner && (
                <div className="match-result">
                  🏆 Winner:{" "}
                  {m.winner.toLowerCase() === NEXUS_ADDRESS.toLowerCase()
                    ? "🤖 NEXUS"
                    : shortAddr(m.winner)}
                  {m.prize && m.prize > 0n && ` · ${ethers.formatEther(m.prize)} RFX`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
