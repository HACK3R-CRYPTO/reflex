/**
 * REFLEX PLAYER SIMULATOR (Formerly NEXUS)
 * 
 * This script allows you to simulate a player challenging the 
 * on-chain Reactive AI (NEXUS) from the terminal.
 * 
 * Flow:
 * 1. Mints/Checks RFX tokens
 * 2. Approves ArenaPlatform
 * 3. Calls playAgainstAI()
 * 4. Listens for the MatchCompleted event (the reactive response)
 */

import {
  createPublicClient,
  createWalletClient,
  webSocket,
  http,
  type Hex,
  formatEther,
  parseEther,
  decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { somniaTestnet, CONTRACTS, GameType } from './config.js';
import { ArenaPlatformABI, ReflexTokenABI } from './abis.js';
import 'dotenv/config';

const rawKey = (process.env.BOT_PRIVATE_KEY || '').trim();
const account = privateKeyToAccount(rawKey.startsWith('0x') ? (rawKey as Hex) : (`0x${rawKey}` as Hex));

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: webSocket(),
});

const httpPublicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: somniaTestnet,
  transport: http(),
});

async function simulatePlay(gameType: GameType, move: number, wagerRFX: string) {
  const wager = parseEther(wagerRFX);
  
  console.log(`\n🎮 Challenging NEXUS AI...`);
  console.log(`   Game: ${GameType[gameType]} | Move: ${move} | Wager: ${wagerRFX} RFX`);

  try {
    // 1. Check/Approve RFX
    const allowance = await httpPublicClient.readContract({
      address: CONTRACTS.reflexToken,
      abi: ReflexTokenABI,
      functionName: 'allowance',
      args: [account.address, CONTRACTS.arenaPlatform],
    });

    if (allowance < wager) {
      console.log('  📝 Approving RFX...');
      const approveTx = await walletClient.writeContract({
        address: CONTRACTS.reflexToken,
        abi: ReflexTokenABI,
        functionName: 'approve',
        args: [CONTRACTS.arenaPlatform, parseEther('1000000')],
      });
      await httpPublicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    // 2. Play
    console.log('  ⚔️ Sending move to ArenaPlatform...');
    const tx = await walletClient.writeContract({
      address: CONTRACTS.arenaPlatform,
      abi: ArenaPlatformABI,
      functionName: 'playAgainstAI',
      args: [gameType, wager, move],
    });
    
    const receipt = await httpPublicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`  ✅ Move recorded! TX: ${tx}`);

    // Extract matchId from logs
    const logs = receipt.logs.map(log => {
        try {
            return decodeEventLog({
                abi: ArenaPlatformABI,
                data: log.data,
                topics: log.topics
            });
        } catch { return null; }
    }).filter(l => l?.eventName === 'PlayerMoved');

    const matchId = (logs[0] as any)?.args?.matchId;
    console.log(`  📌 Match ID: ${matchId}`);
    console.log(`  ⏳ Waiting for NEXUS reactive move (on-chain)...`);

    // 3. Poll for resolution (more reliable than WebSocket on testnet)
    let resolved = false;
    const startTime = Date.now();
    const TIMEOUT = 60000; // 60s

    while (Date.now() - startTime < TIMEOUT) {
        const matchData = await httpPublicClient.readContract({
            address: CONTRACTS.arenaPlatform,
            abi: ArenaPlatformABI,
            functionName: 'getMatch',
            args: [matchId],
        }) as any[];

        const isResolved = matchData[6]; // resolved boolean
        if (isResolved) {
            const winner = matchData[5];
            const aiMove = matchData[4];
            const payout = matchData[2]; // payout is wager if tie, 2*wager if win
            
            const isWinner = winner.toLowerCase() === account.address.toLowerCase();
            
            console.log('\n🏁 MATCH RESOLVED!');
            console.log(`   NEXUS Move: ${aiMove}`);
            console.log(`   Result: ${isWinner ? '🎉 YOU WON!' : '💀 NEXUS WON'}`);
            if (isWinner) console.log(`   Payout: ${formatEther(payout)} RFX`);
            
            resolved = true;
            break;
        }

        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 2000));
    }

    if (!resolved) {
        console.log('\n🛑 Timeout waiting for reactive response. Match still pending.');
        process.exit(1);
    }
    process.exit(0);

  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Default to a Rock-Paper-Scissors game (Rock=0) with 1 RFX wager
const args = process.argv.slice(2);
const gType = args[0] ? parseInt(args[0]) : GameType.RockPaperScissors;
const move = args[1] ? parseInt(args[1]) : 0;
const wager = args[2] || '1';

simulatePlay(gType, move, wager);
