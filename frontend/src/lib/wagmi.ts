import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { somniaTestnet } from "./contracts";

export const config = getDefaultConfig({
  appName: "Reflex",
  projectId: "reflex-hackathon-2026",
  chains: [somniaTestnet],
  ssr: true,
});
