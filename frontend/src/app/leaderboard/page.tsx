"use client";
import { useLeaderboard } from "../lib/useReactivity";
import { NEXUS_ADDRESS } from "../lib/contracts";
import { ethers } from "ethers";
import Link from "next/link";

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function LeaderboardPage() {
  const { players, loading, updatedAddress } = useLeaderboard();

  return (
    <main className="page">
      <div className="page-header">
        <h1>Leaderboard</h1>
        <p className="subtitle">
          Updated in real-time via{" "}
          <span className="badge-cyan">Somnia Reactivity</span>. No polling.
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Connecting to chain…</p>
        </div>
      ) : players.length === 0 ? (
        <div className="empty-state">
          <p>No matches played yet. Be the first!</p>
          <Link href="/arena" className="btn">Enter Arena</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Score</th>
                <th>W</th>
                <th>L</th>
                <th>T</th>
                <th>Earnings (RFX)</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => {
                const isUpdated = updatedAddress === p.address.toLowerCase();
                const isNexus = p.address.toLowerCase() === NEXUS_ADDRESS.toLowerCase();
                return (
                  <tr
                    key={p.address}
                    className={`lb-row ${isUpdated ? "lb-row--flash" : ""} ${isNexus ? "lb-row--nexus" : ""}`}
                  >
                    <td className="rank">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td className="addr">
                      {isNexus ? (
                        <span>
                          🤖 <strong>NEXUS AI</strong>{" "}
                          <span className="addr-sub">{shortAddr(p.address)}</span>
                        </span>
                      ) : (
                        <span>
                          {shortAddr(p.address)}
                          {isUpdated && <span className="live-dot" />}
                        </span>
                      )}
                    </td>
                    <td className="score-col">
                      <span className="score-pill">{p.score.toLocaleString()}</span>
                    </td>
                    <td className="win">{p.wins}</td>
                    <td className="loss">{p.losses}</td>
                    <td className="tie">{p.ties}</td>
                    <td className="earnings">
                      {Number(ethers.formatEther(p.totalEarnings)).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
