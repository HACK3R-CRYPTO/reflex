// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ReflexToken.sol";
import "../src/ReflexPass.sol";
import "../src/ReflexSwap.sol";
import "../src/AgentRegistry.sol";
import "../src/ArenaPlatform.sol";
import "../src/ReactiveLeaderboard.sol";
import "../src/ReactiveHandler.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address treasury = deployer; // Use deployer as treasury initially

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ReflexToken
        ReflexToken rfx = new ReflexToken(deployer);
        console.log("ReflexToken:", address(rfx));

        // 2. Deploy ReflexSwap
        ReflexSwap swap = new ReflexSwap(address(rfx), deployer);
        rfx.setMinter(address(swap), true);
        console.log("ReflexSwap:", address(swap));

        // 3. Deploy ReflexPass
        ReflexPass pass = new ReflexPass(address(rfx), treasury, deployer);
        console.log("ReflexPass:", address(pass));

        // 4. Deploy AgentRegistry
        AgentRegistry registry = new AgentRegistry(deployer);
        console.log("AgentRegistry:", address(registry));

        // 5. Deploy ArenaPlatform
        ArenaPlatform arena = new ArenaPlatform(
            address(rfx),
            address(pass),
            treasury,
            deployer
        );
        console.log("ArenaPlatform:", address(arena));

        // 6. Deploy ReactiveLeaderboard
        ReactiveLeaderboard leaderboard = new ReactiveLeaderboard(deployer);
        console.log("ReactiveLeaderboard:", address(leaderboard));

        // 7. Deploy ReactiveHandler (Somnia Reactivity on-chain subscriber)
        ReactiveHandler handler = new ReactiveHandler(deployer);
        handler.setArenaPlatform(address(arena));
        console.log("ReactiveHandler:", address(handler));

        // ── Wire up permissions ──

        // Arena can update agent stats
        registry.setStatUpdater(address(arena), true);

        // Arena knows about leaderboard and registry
        arena.setLeaderboard(address(leaderboard));
        arena.setAgentRegistry(address(registry));

        // Leaderboard accepts calls from Arena
        leaderboard.setAuthorizedCaller(address(arena), true);

        // Register NEXUS bot natively attached to the Arena platform
        registry.registerOfficial(address(arena), "NEXUS", "Native Reactive AI Agent using prevrandao");

        // Fund solo rewards pool (10M RFX from initial supply)
        rfx.approve(address(arena), 10_000_000 ether);
        arena.fundHouse(10_000_000 ether);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Deployer / Treasury:", deployer);
        console.log("");
        console.log("Next steps:");
        console.log("1. Create Reactivity subscription for ReactiveHandler via SDK:");
        console.log("   sdk.createSoliditySubscription({ handlerContractAddress: ReactiveHandler })");
        console.log("2. Update .env with contract addresses");
        console.log("3. Start NEXUS agent: cd agent && npm run nexus");
    }
}
