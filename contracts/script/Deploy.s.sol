// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ReflexToken} from "../src/ReflexToken.sol";
import {ReflexPass} from "../src/ReflexPass.sol";
import {ReflexSwap} from "../src/ReflexSwap.sol";
import {ArenaPlatform} from "../src/ArenaPlatform.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ReactiveLeaderboard} from "../src/ReactiveLeaderboard.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ReflexToken (RFX)
        ReflexToken rfx = new ReflexToken(deployerAddress);
        console.log("ReflexToken deployed to:", address(rfx));

        // 2. Deploy ReflexPass (NFT) — requires 10 RFX to mint
        uint256 mintPrice = 10 * 10 ** 18;
        ReflexPass pass = new ReflexPass(address(rfx), mintPrice, deployerAddress);
        console.log("ReflexPass deployed to:", address(pass));

        // 3. Deploy ReflexSwap — 1 SOMNI = 100 RFX
        uint256 swapRate = 100;
        ReflexSwap swap = new ReflexSwap(address(rfx), swapRate, deployerAddress);
        console.log("ReflexSwap deployed to:", address(swap));

        // 4. Deploy ArenaPlatform — treasury set to deployer
        ArenaPlatform arena = new ArenaPlatform(deployerAddress, address(rfx));
        console.log("ArenaPlatform deployed to:", address(arena));

        // 5. Deploy AgentRegistry
        AgentRegistry registry = new AgentRegistry();
        console.log("AgentRegistry deployed to:", address(registry));

        // 6. Deploy ReactiveLeaderboard — pass ArenaPlatform address for event filtering
        ReactiveLeaderboard leaderboard = new ReactiveLeaderboard(address(arena));
        console.log("ReactiveLeaderboard deployed to:", address(leaderboard));

        // --- Setup Roles & Permissions ---

        // ReflexSwap needs to be able to mint RFX
        rfx.setMinterStatus(address(swap), true);
        console.log("Added ReflexSwap as minter on ReflexToken");

        vm.stopBroadcast();

        // NOTE: After deployment, run the subscribe script separately:
        //   npm run subscribe -- --arena <arena_address> --leaderboard <leaderboard_address>
        // This registers the on-chain reactivity subscription via the TypeScript SDK.
        console.log("\n--- NEXT STEP ---");
        console.log("Register on-chain reactivity subscription by running:");
        console.log("  cd ../agent && npm run subscribe");
        console.log("  (set ARENA_PLATFORM_ADDRESS and REACTIVE_LEADERBOARD_ADDRESS in .env)");
    }
}
