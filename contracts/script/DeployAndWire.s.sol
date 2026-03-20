// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ReactiveHandler.sol";
import "../src/AgentRegistry.sol";
import "../src/ArenaPlatform.sol";
import "../src/ReactiveLeaderboard.sol";
import "../src/ReflexToken.sol";

contract DeployAndWire is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        address rfxAddr      = vm.envAddress("REFLEX_TOKEN_ADDRESS");
        address registryAddr = vm.envAddress("AGENT_REGISTRY_ADDRESS");
        address arenaAddr    = vm.envAddress("ARENA_PLATFORM_ADDRESS");
        address lbAddr       = vm.envAddress("REACTIVE_LEADERBOARD_ADDRESS");

        ReflexToken rfx        = ReflexToken(rfxAddr);
        AgentRegistry registry = AgentRegistry(registryAddr);
        ArenaPlatform arena    = ArenaPlatform(arenaAddr);
        ReactiveLeaderboard lb = ReactiveLeaderboard(lbAddr);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy fresh ReactiveHandler
        ReactiveHandler handler = new ReactiveHandler(vm.addr(deployerPrivateKey));
        handler.setArenaPlatform(arenaAddr);
        console.log("ReactiveHandler:", address(handler));

        // Wire permissions
        registry.setStatUpdater(arenaAddr, true);
        arena.setLeaderboard(lbAddr);
        arena.setAgentRegistry(registryAddr);
        lb.setAuthorizedCaller(arenaAddr, true);

        // Register NEXUS (arena = the native AI)
        registry.registerOfficial(arenaAddr, "NEXUS", "Native Reactive AI using prevrandao");

        // Fund house with 1000 RFX
        rfx.approve(arenaAddr, 1_000 ether);
        arena.fundHouse(1_000 ether);

        vm.stopBroadcast();

        console.log("=== DeployAndWire Complete ===");
        console.log("Next: update REACTIVE_HANDLER_ADDRESS in .env to:", address(handler));
    }
}
