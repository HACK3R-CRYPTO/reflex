"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/arena", label: "Arena" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/bots", label: "Bots" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              REFLEX
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === href
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </nav>
  );
}
