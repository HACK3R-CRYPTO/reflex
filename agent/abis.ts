// ABI fragments for Reflex contracts — only the functions/events we need

export const ArenaPlatformABI = [
  {
    "type": "function",
    "name": "getMatch",
    "inputs": [{ "name": "_id", "type": "uint256" }],
    "outputs": [
      { "name": "player", "type": "address" },
      { "name": "gameType", "type": "uint8" },
      { "name": "wager", "type": "uint256" },
      { "name": "move", "type": "uint8" },
      { "name": "aiMove", "type": "uint8" },
      { "name": "winner", "type": "address" },
      { "name": "resolved", "type": "bool" },
      { "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "playAgainstAI",
    "inputs": [
      { "name": "_gameType", "type": "uint8" },
      { "name": "_wager", "type": "uint256" },
      { "name": "_move", "type": "uint8" }
    ],
    "outputs": [{ "name": "matchId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submitSoloScore",
    "inputs": [
      { "name": "_player", "type": "address" },
      { "name": "_score", "type": "uint256" },
      { "name": "_gameType", "type": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "fundHouse",
    "inputs": [{ "name": "_amount", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "MatchCompleted",
    "inputs": [
      { "name": "matchId", "type": "uint256", "indexed": true },
      { "name": "winner", "type": "address", "indexed": true },
      { "name": "loser", "type": "address", "indexed": true },
      { "name": "payout", "type": "uint256", "indexed": false },
      { "name": "aiMove", "type": "uint8", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlayerMoved",
    "inputs": [
      { "name": "matchId", "type": "uint256", "indexed": true },
      { "name": "player", "type": "address", "indexed": true },
      { "name": "move", "type": "uint8", "indexed": false }
    ],
    "anonymous": false
  }
] as const;

export const ReflexTokenABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
