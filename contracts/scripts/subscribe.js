const { SDK } = require('@somnia-chain/reactivity');
const { privateKeyToAccount } = require('viem/accounts');
const { createPublicClient, createWalletClient, http, keccak256, toBytes, parseGwei } = require('viem');
const { somniaTestnet } = require('viem/chains');
require('dotenv').config();

async function main() {
  console.log('🔧 Initializing Somnia Reactivity JS SDK for Reflex...');

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('❌ DEPLOYER_PRIVATE_KEY not found in .env');
  }

  const rawKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
  const account = privateKeyToAccount(
    rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`
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

  const ARENA = process.env.ARENA_PLATFORM_ADDRESS;
  const HANDLER = process.env.REACTIVE_HANDLER_ADDRESS;

  console.log('🎮 ArenaPlatform (Emitter):', ARENA);
  console.log('🛡️ ReactiveHandler (Handler):', HANDLER);

  const PLAYER_MOVED_SIG = keccak256(toBytes("PlayerMoved(uint256,address,uint8)"));
  console.log('🔔 Event Signature:', PLAYER_MOVED_SIG);

  const subData = {
    handlerContractAddress: ARENA, // Direct reactive resolution
    priorityFeePerGas: parseGwei('2'),
    maxFeePerGas: parseGwei('10'),
    gasLimit: 8000000n, 
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

  console.log('✅ Confirmed in block:', receipt.blockNumber.toString());
  
  if (receipt.logs[0] && receipt.logs[0].topics[2]) {
    const subscriptionId = BigInt(receipt.logs[0].topics[2]);
    console.log('\n📌 SUBSCRIPTION ID:', subscriptionId.toString());
  }

  console.log('\n🎉 Reflex Reactivity Subscription ACTIVE!');
}

main().catch(console.error);
