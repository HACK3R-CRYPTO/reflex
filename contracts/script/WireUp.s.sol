// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ReflexToken.sol";
import "../src/AgentRegistry.sol";
import "../src/ArenaPlatform.sol";
import "../src/ReactiveLeaderboard.sol";
import "../src/ReactiveHandler.sol";

/// @notice Run this AFTER deploying to wire up permissions and fund the house reward pool.
contract WireUp is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // ── Pull deployed addresses from .env ──
        address rfxAddr      = vm.envAddress("REFLEX_TOKEN_ADDRESS");
        address registryAddr = vm.envAddress("AGENT_REGISTRY_ADDRESS");
        address arenaAddr    = vm.envAddress("ARENA_PLATFORM_ADDRESS");
        address lbAddr       = vm.envAddress("REACTIVE_LEADERBOARD_ADDRESS");
        address handlerAddr  = vm.envAddress("REACTIVE_HANDLER_ADDRESS");

        ReflexToken rfx          = ReflexToken(rfxAddr);
        AgentRegistry registry   = AgentRegistry(registryAddr);
        ArenaPlatform arena      = ArenaPlatform(arenaAddr);
        ReactiveLeaderboard lb   = ReactiveLeaderboard(lbAddr);
        ReactiveHandler handler  = ReactiveHandler(handlerAddr);

        vm.startBroadcast(deployerPrivateKey);

        // Wire arena → handler
        handler.setArenaPlatform(arenaAddr);

        // Permissions
        registry.setStatUpdater(arenaAddr, true);
        arena.setLeaderboard(lbAddr);
        arena.setAgentRegistry(registryAddr);
        lb.setAuthorizedCaller(arenaAddr, true);

        // Register NEXUS (arena itself is the on-chain AI agent)
        registry.registerOfficial(arenaAddr, "NEXUS", "Native Reactive AI using prevrandao");

        // Fund house with a small amount for testing (1000 RFX)
        // The owner has 100M RFX minted at deployment
        rfx.approve(arenaAddr, 1_000 ether);
        arena.fundHouse(1_000 ether);

        vm.stopBroadcast();

        console.log("=== WireUp Complete ===");
        console.log("Arena funded with 1000 RFX house pool.");
        console.log("Next: create Somnia Reactivity subscription for handler:", handlerAddr);
    }
}
