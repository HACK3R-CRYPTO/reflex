import Link from "next/link";
import "./globals.css";

export default function Home() {
  return (
    <main className="hero">
      <h1>REFLEX</h1>
      <p>
        The first real-time on-chain gaming platform built natively for Somnia Reactivity. 
        Where every score, match, and rank change hits your screen in milliseconds.
      </p>

      <Link href="/play" className="btn">
        ENTER ARENA
      </Link>

      <div className="grid">
        <div className="card">
          <h3>SOLO ASCENSION</h3>
          <p>
            Master Rhythm and Memory games to grind RFX 
            tokens and fund your ascent.
          </p>
        </div>
        <div className="card">
          <h3>PVP ARENA</h3>
          <p>
            Wager RFX against humans or the NEXUS AI in 
            provably fair commit-reveal matches.
          </p>
        </div>
        <div className="card">
          <h3>REACTIVE LIVE</h3>
          <p>
            No polling. No refresh. The chain pushes 
            directly to your screen via Somnia Reactivity.
          </p>
        </div>
      </div>

      <footer style={{ marginTop: 'auto' }}>
        Built for Somnia Reactivity Mini Hackathon 2026
      </footer>
    </main>
  );
}
