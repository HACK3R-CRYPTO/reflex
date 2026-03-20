/**
 * Score Validator — Anti-cheat for Reflex solo games (Updated)
 *
 * Receives score submissions from the frontend, validates them,
 * and submits to ArenaPlatform.submitSoloScore() on-chain.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  verifyMessage,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { somniaTestnet, CONTRACTS } from './config.js';
import { ArenaPlatformABI } from './abis.js';
import { createServer } from 'http';
import 'dotenv/config';

const account = privateKeyToAccount(process.env.VALIDATOR_PRIVATE_KEY as Hex);

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: somniaTestnet,
  transport: http(),
});

console.log('═══════════════════════════════════════');
console.log('  Reflex Score Validator');
console.log('  (Somnia Testnet Edition)');
console.log('═══════════════════════════════════════');
console.log(`Validator wallet: ${account.address}`);
console.log(`Target Arena: ${CONTRACTS.arenaPlatform}`);

// ── Anti-Cheat Rules (Match frontend games) ──

const GAME_RULES = {
  0: { name: 'Rhythm', maxScore: 200000, minDuration: 5000, maxPerHour: 50 },
  1: { name: 'Memory', maxScore: 100000, minDuration: 3000, maxPerHour: 100 },
  2: { name: 'Strategy Battle', maxScore: 150000, minDuration: 10000, maxPerHour: 30 },
} as const;

const rateLimiter = new Map<string, { count: number; windowStart: number }>();

interface ScoreSubmission {
  player: string;
  score: number;
  gameType: number;
  timestamp: number;
  duration: number;
  signature: string;
  nonce: string;
}

function validateScore(submission: ScoreSubmission): { valid: boolean; reason?: string } {
  const rules = GAME_RULES[submission.gameType as keyof typeof GAME_RULES];
  if (!rules) return { valid: false, reason: `Invalid game type: ${submission.gameType}` };

  if (submission.score <= 0) return { valid: false, reason: 'Score must be positive' };
  if (submission.score > rules.maxScore) return { valid: false, reason: `Score ${submission.score} exceeds max ${rules.maxScore}` };
  if (submission.duration < rules.minDuration) return { valid: false, reason: 'Duration too short' };

  const now = Date.now();
  if (Math.abs(now - submission.timestamp) > 10 * 60 * 1000) return { valid: false, reason: 'Timestamp expired' };

  const key = `${submission.player}-${submission.gameType}`;
  const limit = rateLimiter.get(key);
  if (limit && now - limit.windowStart < 60 * 60 * 1000 && limit.count >= rules.maxPerHour) {
      return { valid: false, reason: 'Rate limit exceeded' };
  }
  rateLimiter.set(key, limit ? { ...limit, count: limit.count + 1 } : { count: 1, windowStart: now });

  return { valid: true };
}

async function submitScoreOnChain(player: string, score: number, gameType: number): Promise<string> {
  const tx = await walletClient.writeContract({
    address: CONTRACTS.arenaPlatform,
    abi: ArenaPlatformABI,
    functionName: 'submitSoloScore',
    args: [player as `0x${string}`, BigInt(score), gameType],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  return tx;
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'POST' && req.url === '/submit-score') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const sub: ScoreSubmission = JSON.parse(body);
        const v = validateScore(sub);
        if (!v.valid) {
          res.writeHead(400); res.end(JSON.stringify({ error: v.reason })); return;
        }

        const message = `REFLEX:${sub.player}:${sub.score}:${sub.gameType}:${sub.nonce}`;
        const sigValid = await verifyMessage({ address: sub.player as `0x${string}`, message, signature: sub.signature as Hex });

        if (!sigValid) {
          res.writeHead(401); res.end(JSON.stringify({ error: 'Invalid signature' })); return;
        }

        const txHash = await submitScoreOnChain(sub.player, sub.score, sub.gameType);
        res.writeHead(200); res.end(JSON.stringify({ success: true, txHash }));
      } catch (err: any) {
        res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404); res.end();
  }
});

const PORT = process.env.VALIDATOR_PORT || 3001;
server.listen(PORT, () => {
    console.log(`📡 Score validator listening on port ${PORT}`);
});
