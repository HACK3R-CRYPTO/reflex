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
        
        // The Agent address that will update the leaderboard reactive-ly
        address agentAddress = vm.envAddress("AGENT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ReflexToken (RFX)
        ReflexToken rfx = new ReflexToken(deployerAddress);
        console.log("ReflexToken deployed to:", address(rfx));

        // 2. Deploy ReflexPass (NFT)
        // Pass requires 10 RFX to mint
        uint256 mintPrice = 10 * 10 ** 18; 
        ReflexPass pass = new ReflexPass(address(rfx), mintPrice, deployerAddress);
        console.log("ReflexPass deployed to:", address(pass));

        // 3. Deploy ReflexSwap
        // 1 SOMNI = 100 RFX
        uint256 swapRate = 100;
        ReflexSwap swap = new ReflexSwap(address(rfx), swapRate, deployerAddress);
        console.log("ReflexSwap deployed to:", address(swap));

        // 4. Deploy ArenaPlatform
        // Treasury gets the fees. For now, set deployer as treasury.
        ArenaPlatform arena = new ArenaPlatform(deployerAddress, address(rfx));
        console.log("ArenaPlatform deployed to:", address(arena));

        // 5. Deploy AgentRegistry
        AgentRegistry registry = new AgentRegistry();
        console.log("AgentRegistry deployed to:", address(registry));

        // 6. Deploy ReactiveLeaderboard
        ReactiveLeaderboard leaderboard = new ReactiveLeaderboard();
        console.log("ReactiveLeaderboard deployed to:", address(leaderboard));

        // --- Setup Roles & Permissions ---
        
        // ReflexSwap needs to be able to mint RFX
        rfx.setMinterStatus(address(swap), true);
        console.log("Added ReflexSwap as minter on ReflexToken");

        // Grant Agent the authorized role to record match results off-chain (Reactivity)
        leaderboard.setAuthorizedUpdater(agentAddress);
        console.log("Authorized Agent address on ReactiveLeaderboard:", agentAddress);

        vm.stopBroadcast();
    }
}
