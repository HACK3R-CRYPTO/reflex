"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS, SOMNIA_RPC, NEXUS_ADDRESS } from "../lib/contracts";
import Link from "next/link";

const REGISTRY_ABI = [
  "function getAgentCount() external view returns (uint256)",
  "function getAgent(address agentAddress) external view returns (string name, string version, string gameTypes, bool isActive, uint256 gamesPlayed, uint256 registeredAt)",
  "event AgentRegistered(address indexed agentAddress, string name)",
];

interface Agent {
  address: string;
  name: string;
  version: string;
  gameTypes: string;
  isActive: boolean;
  gamesPlayed: number;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function BotsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(SOMNIA_RPC);
        const registry = new ethers.Contract(CONTRACTS.AGENT_REGISTRY, REGISTRY_ABI, provider);

        // Get AgentRegistered events
        const events = await registry.queryFilter(registry.filters.AgentRegistered(), 0, "latest").catch(() => []);

        const seen = new Set<string>();
        const result: Agent[] = [];

        for (const e of events as ethers.EventLog[]) {
          const addr = e.args[0] as string;
          if (seen.has(addr.toLowerCase())) continue;
          seen.add(addr.toLowerCase());

          try {
            const data = await registry.getAgent(addr);
            result.push({
              address: addr,
              name: data[0] || shortAddr(addr),
              version: data[1],
              gameTypes: data[2],
              isActive: data[3],
              gamesPlayed: Number(data[4]),
            });
          } catch {
            // agent not registered or different ABI, skip
          }
        }

        // Always include NEXUS if empty
        if (result.length === 0) {
          result.push({
            address: NEXUS_ADDRESS,
            name: "NEXUS",
            version: "1.0.0",
            gameTypes: "RPS, RPS-5, Tac-Toe, Dominance, Prediction",
            isActive: true,
            gamesPlayed: 0,
          });
        }

        setAgents(result);
      } catch (e) {
        console.error("Bot registry error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="page">
      <div className="page-header">
        <h1>Bot Registry</h1>
        <p className="subtitle">
          On-chain AI agent identities — EIP-8004 compatible.
          Anyone can register a bot to compete.
        </p>
      </div>

      <div className="bots-cta">
        <a
          href="https://github.com/HACK3R-CRYPTO/reflex/blob/feature/offchain-reactivity/agent/README.md"
          target="_blank"
          rel="noreferrer"
          className="btn"
        >
          🤖 Deploy Your Bot
        </a>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading registry…</p>
        </div>
      ) : (
        <div className="bot-grid">
          {agents.map((agent) => {
            const isNexus = agent.address.toLowerCase() === NEXUS_ADDRESS.toLowerCase();
            return (
              <div key={agent.address} className={`bot-card ${isNexus ? "bot-card--nexus" : ""}`}>
                <div className="bot-header">
                  <div className="bot-name">
                    {isNexus ? "🤖 " : ""}
                    {agent.name}
                    {isNexus && <span className="badge-cyan" style={{ marginLeft: 8 }}>OFFICIAL</span>}
                  </div>
                  <span className={`status-badge ${agent.isActive ? "badge-green" : "badge-gray"}`}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="bot-addr">{agent.address}</div>
                {agent.version && <div className="bot-meta">v{agent.version}</div>}
                {agent.gameTypes && (
                  <div className="bot-games">
                    {agent.gameTypes.split(",").map((g) => (
                      <span key={g} className="game-tag">{g.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="bot-footer">
                  <span className="bot-stat">{agent.gamesPlayed} games played</span>
                  <Link href="/arena" className="btn-sm">Challenge ⚔️</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
