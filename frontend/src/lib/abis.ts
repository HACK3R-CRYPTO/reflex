export const ReflexTokenABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;

export const ReflexSwapABI = [
  { type: "function", name: "swap", inputs: [], outputs: [], stateMutability: "payable" },
  { type: "function", name: "rate", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
] as const;

export const ReflexPassABI = [
  { type: "function", name: "mint", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "hasPass", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "mintCost", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalMinted", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const ArenaPlatformABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_rfxToken",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_reflexPass",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "agentRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IAgentRegistry"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "burnBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "dailyRewardCap",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "dailyRewardsClaimed",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "fundHouse",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "outputs": [
      { "name": "player", "type": "address", "internalType": "address" },
      { "name": "gameType", "type": "uint8", "internalType": "enum ArenaPlatform.GameType" },
      { "name": "wager", "type": "uint256", "internalType": "uint256" },
      { "name": "move", "type": "uint8", "internalType": "uint8" },
      { "name": "aiMove", "type": "uint8", "internalType": "uint8" },
      { "name": "winner", "type": "address", "internalType": "address" },
      { "name": "resolved", "type": "bool", "internalType": "bool" },
      { "name": "createdAt", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lastRewardDay",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "leaderboard",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IReactiveLeaderboard"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "matchRequests",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      { "name": "player", "type": "address", "internalType": "address" },
      { "name": "gameType", "type": "uint8", "internalType": "enum ArenaPlatform.GameType" },
      { "name": "wager", "type": "uint256", "internalType": "uint256" },
      { "name": "move", "type": "uint8", "internalType": "uint8" },
      { "name": "aiMove", "type": "uint8", "internalType": "uint8" },
      { "name": "winner", "type": "address", "internalType": "address" },
      { "name": "resolved", "type": "bool", "internalType": "bool" },
      { "name": "createdAt", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextMatchId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onEvent",
    "inputs": [
      {
        "name": "emitter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "eventTopics",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "playAgainstAI",
    "inputs": [
      {
        "name": "_gameType",
        "type": "uint8",
        "internalType": "enum ArenaPlatform.GameType"
      },
      {
        "name": "_wager",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_move",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [
      {
        "name": "matchId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "reflexPass",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IReflexPass"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rfxToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IRFX"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "scoreValidators",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setAgentRegistry",
    "inputs": [
      {
        "name": "_r",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDailyRewardCap",
    "inputs": [
      {
        "name": "_c",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFees",
    "inputs": [
      {
        "name": "_b",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_t",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setLeaderboard",
    "inputs": [
      {
        "name": "_l",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setScoreValidator",
    "inputs": [
      {
        "name": "_v",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_s",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setSoloRewardPerPoint",
    "inputs": [
      {
        "name": "_a",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setTreasury",
    "inputs": [
      {
        "name": "_t",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "soloRewardPerPoint",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "submitSoloScore",
    "inputs": [
      {
        "name": "_player",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_score",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_gameType",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "treasuryBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "MatchCompleted",
    "inputs": [
      {
        "name": "matchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "winner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "loser",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "payout",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "aiMove",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlayerMoved",
    "inputs": [
      {
        "name": "matchId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "player",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "move",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SoloScoreSubmitted",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "score",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "gameType",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OnlyReactivityPrecompile",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  }
] as const;

export const AgentRegistryABI = [
  { type: "function", name: "getAgent", inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "tuple", components: [{ name: "wallet", type: "address" }, { name: "name", type: "string" }, { name: "strategy", type: "string" }, { name: "isOfficial", type: "bool" }, { name: "active", type: "bool" }, { name: "wins", type: "uint256" }, { name: "losses", type: "uint256" }, { name: "draws", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "isAgent", inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "agentList", inputs: [{ name: "index", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getAgentCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "AgentRegistered", inputs: [{ name: "wallet", type: "address", indexed: true }, { name: "name", type: "string", indexed: false }, { name: "isOfficial", type: "bool", indexed: false }] },
] as const;

export const LeaderboardABI = [
  { type: "function", name: "getPlayerStats", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "tuple", components: [{ name: "totalScore", type: "uint256" }, { name: "soloHighScore", type: "uint256" }, { name: "pvpWins", type: "uint256" }, { name: "pvpLosses", type: "uint256" }, { name: "pvpDraws", type: "uint256" }, { name: "totalMatches", type: "uint256" }, { name: "rfxEarned", type: "uint256" }, { name: "rfxWagered", type: "uint256" }] }], stateMutability: "view" },
  { type: "function", name: "getTopPlayers", inputs: [], outputs: [{ type: "address[]" }], stateMutability: "view" },
  { type: "function", name: "topPlayerCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "event", name: "LeaderboardUpdated", inputs: [{ name: "player", type: "address", indexed: true }, { name: "newScore", type: "uint256", indexed: false }] },
] as const;
