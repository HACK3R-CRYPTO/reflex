// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ReflexToken.sol";
import "../src/AgentRegistry.sol";
import "../src/ArenaPlatform.sol";
import "../src/ReactiveLeaderboard.sol";
import "../src/ReactiveHandler.sol";

contract FinalWireUp is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        address rfxAddr      = vm.envAddress("REFLEX_TOKEN_ADDRESS");
        address registryAddr = vm.envAddress("AGENT_REGISTRY_ADDRESS");
        address arenaAddr    = vm.envAddress("ARENA_PLATFORM_ADDRESS");
        address lbAddr       = vm.envAddress("REACTIVE_LEADERBOARD_ADDRESS");
        address handlerAddr  = vm.envAddress("REACTIVE_HANDLER_ADDRESS");

        vm.startBroadcast(pk);

        ReactiveHandler(handlerAddr).setArenaPlatform(arenaAddr);
        AgentRegistry(registryAddr).setStatUpdater(arenaAddr, true);
        ArenaPlatform(arenaAddr).setLeaderboard(lbAddr);
        ArenaPlatform(arenaAddr).setAgentRegistry(registryAddr);
        ReactiveLeaderboard(lbAddr).setAuthorizedCaller(arenaAddr, true);
        
        AgentRegistry(registryAddr).registerOfficial(arenaAddr, "NEXUS", "Native Reactive AI using prevrandao");

        ReflexToken(rfxAddr).approve(arenaAddr, 1000 ether);
        ArenaPlatform(arenaAddr).fundHouse(1000 ether);

        vm.stopBroadcast();
    }
}
