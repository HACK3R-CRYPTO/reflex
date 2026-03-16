import Link from "next/link";

const games = [
  {
    href: "/arena",
    icon: "⚔️",
    title: "PvP Arena",
    desc: "Commit-reveal matches against humans or NEXUS AI. Wager RFX.",
    tag: "LIVE",
    tagClass: "badge-green",
  },
  {
    href: "#",
    icon: "🎵",
    title: "Rhythm",
    desc: "Hit the beats, earn RFX. Solo grind to fund your PvP wagers.",
    tag: "SOON",
    tagClass: "badge-gray",
  },
  {
    href: "#",
    icon: "🧠",
    title: "Memory",
    desc: "Pattern recall under pressure. Score multipliers stack fast.",
    tag: "SOON",
    tagClass: "badge-gray",
  },
];

export default function PlayPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1>Play</h1>
        <p className="subtitle">Choose your game mode</p>
      </div>

      <div className="game-grid">
        {games.map((g) => (
          <Link
            key={g.title}
            href={g.href}
            className={`game-card ${g.tag === "SOON" ? "game-card--disabled" : ""}`}
          >
            <div className="game-icon">{g.icon}</div>
            <div className="game-info">
              <div className="game-title-row">
                <h3>{g.title}</h3>
                <span className={`status-badge ${g.tagClass}`}>{g.tag}</span>
              </div>
              <p>{g.desc}</p>
            </div>
            {g.tag !== "SOON" && <span className="arrow">→</span>}
          </Link>
        ))}
      </div>
    </main>
  );
}
