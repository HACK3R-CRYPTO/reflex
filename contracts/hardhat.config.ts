import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    somniaTestnet: {
      url: process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network/",
      chainId: 50312,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      timeout: 120000,
      gasPrice: "auto",
    },
  },
};

export default config;
