// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;

    address agentOwner1 = address(1);
    address agentOwner2 = address(2);

    function setUp() public {
        registry = new AgentRegistry();
    }

    function test_RegisterNewAgent() public {
        vm.startPrank(agentOwner1);
        
        registry.registerAgent(
            "BotAlpha",
            "Markov v1",
            "Plays pseudo-randomly",
            "ipfs://metadata"
        );

        AgentRegistry.AgentProfile memory profile = registry.getAgent(agentOwner1);
        
        assertEq(profile.owner, agentOwner1);
        assertEq(profile.name, "BotAlpha");
        assertEq(profile.model, "Markov v1");
        assertTrue(profile.active);
        assertEq(profile.gamesPlayed, 0);
        
        address[] memory all = registry.getAllAgents();
        assertEq(all.length, 1);
        assertEq(all[0], agentOwner1);

        vm.stopPrank();
    }

    function test_UpdateExistingAgent() public {
        vm.startPrank(agentOwner1);
        
        registry.registerAgent("BotAlpha", "Markov v1", "Test", "ipfs");
        
        // Update name
        registry.registerAgent("BotAlpha-Updated", "Markov v2", "Test2", "ipfs2");

        AgentRegistry.AgentProfile memory profile = registry.getAgent(agentOwner1);
        
        assertEq(profile.name, "BotAlpha-Updated");
        assertEq(profile.model, "Markov v2");
        
        // Ensure it didn't add duplicate to the array
        assertEq(registry.getAllAgents().length, 1);
        vm.stopPrank();
    }

    function test_IncrementGames() public {
        vm.startPrank(agentOwner1);
        registry.registerAgent("BotAlpha", "Markov v1", "Test", "ipfs");
        vm.stopPrank();

        // Anyone can increment currently (per design for hackathon simplicity, would be gated in prod)
        registry.incrementGames(agentOwner1);
        registry.incrementGames(agentOwner1);

        AgentRegistry.AgentProfile memory profile = registry.getAgent(agentOwner1);
        assertEq(profile.gamesPlayed, 2);
    }

    function test_DeactivateAgent() public {
        vm.startPrank(agentOwner1);
        registry.registerAgent("BotAlpha", "Markov v1", "Test", "ipfs");
        
        registry.deactivateAgent();
        
        AgentRegistry.AgentProfile memory profile = registry.getAgent(agentOwner1);
        assertFalse(profile.active);
        vm.stopPrank();
    }

    function test_RevertIf_DeactivateAsNonOwner() public {
        vm.prank(agentOwner1);
        registry.registerAgent("BotAlpha", "Markov v1", "Test", "ipfs");

        vm.prank(agentOwner2);
        vm.expectRevert(AgentRegistry.NotOwner.selector);
        registry.deactivateAgent();
    }
}
