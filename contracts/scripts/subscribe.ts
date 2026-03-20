import { SDK } from '@somnia-chain/reactivity';
import { privateKeyToAccount } from 'viem/accounts';
import { somniaTestnet } from 'viem/chains';
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toBytes,
  parseGwei
} from 'viem';
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log('🔧 Initializing Somnia Reactivity SDK for Reflex...');

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('❌ DEPLOYER_PRIVATE_KEY not found in .env');
  }

  const account = privateKeyToAccount(
    (process.env.DEPLOYER_PRIVATE_KEY.startsWith('0x') ? process.env.DEPLOYER_PRIVATE_KEY : `0x${process.env.DEPLOYER_PRIVATE_KEY}`) as `0x${string}`
  );

  console.log('👤 Account:', account.address);

  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http()
  });

  const sdk = new SDK({
    public: publicClient,
    wallet: walletClient
  });

  // Balance check
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Balance: ${Number(balance) / 1e18} STT`);

  const ARENA = process.env.ARENA_PLATFORM_ADDRESS as `0x${string}`;
  const HANDLER = process.env.REACTIVE_HANDLER_ADDRESS as `0x${string}`;

  console.log('🎮 ArenaPlatform (Emitter):', ARENA);
  console.log('🛡️ ReactiveHandler (Handler):', HANDLER);

  // PlayerMoved(uint256 indexed matchId, address indexed player, uint8 move)
  const PLAYER_MOVED_SIG = keccak256(toBytes("PlayerMoved(uint256,address,uint8)"));
  console.log('🔔 Event Signature:', PLAYER_MOVED_SIG);

  const subData = {
    handlerContractAddress: HANDLER,
    priorityFeePerGas: parseGwei('2'),
    maxFeePerGas: parseGwei('10'),
    gasLimit: 4_000_000n, 
    isGuaranteed: true,
    isCoalesced: false,
    eventTopics: [PLAYER_MOVED_SIG],
    emitter: ARENA,
  };

  console.log('\n🚀 Creating subscription...');
  const txHash = await sdk.createSoliditySubscription(subData);

  if (txHash instanceof Error) {
    throw txHash;
  }

  console.log('✅ Subscription TX:', txHash);
  
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1
  });

  console.log('✅ Confirmed in block:', receipt.blockNumber);
  
  if (receipt.logs[0] && receipt.logs[0].topics[2]) {
    const subscriptionId = BigInt(receipt.logs[0].topics[2]);
    console.log('\n📌 SUBSCRIPTION ID:', subscriptionId.toString());
  }

  console.log('\n🎉 Reflex Reactivity Subscription ACTIVE!');
}

main().catch(console.error);
