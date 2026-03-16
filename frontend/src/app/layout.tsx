import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reflex — Real-Time On-Chain Gaming",
  description: "The first real-time gaming platform built natively on Somnia Reactivity. Match results, scores, and leaderboard changes hit your screen in milliseconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <nav className="nav">
          <Link href="/" className="nav-logo">REFLEX</Link>
          <div className="nav-links">
            <Link href="/play" className="nav-link">Play</Link>
            <Link href="/arena" className="nav-link">Arena</Link>
            <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
            <Link href="/bots" className="nav-link">Bots</Link>
          </div>
        </nav>
        {children}
        <footer>Built for Somnia Reactivity Mini Hackathon 2026</footer>
      </body>
    </html>
  );
}
