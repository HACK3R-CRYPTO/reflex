// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public owner = address(1);
    address public nexusWallet = address(2);
    address public botDev = address(3);
    address public arena = address(4);

    function setUp() public {
        registry = new AgentRegistry(owner);

        vm.prank(owner);
        registry.setStatUpdater(arena, true);
    }

    function test_RegisterOfficial() public {
        vm.prank(owner);
        registry.registerOfficial(nexusWallet, "NEXUS", "Nash Equilibrium");

        (string memory name,, address wallet, bool isOfficial, bool isActive,,,, uint256 registeredAt) = registry.agents(nexusWallet);
        assertEq(name, "NEXUS");
        assertEq(wallet, nexusWallet);
        assertTrue(isOfficial);
        assertTrue(isActive);
        assertGt(registeredAt, 0);
        assertTrue(registry.isAgent(nexusWallet));
    }

    function test_RegisterOfficial_RevertNonOwner() public {
        vm.prank(botDev);
        vm.expectRevert();
        registry.registerOfficial(nexusWallet, "NEXUS", "Nash");
    }

    function test_RegisterCommunity() public {
        vm.prank(botDev);
        registry.registerCommunity("MyBot", "Aggressive RPS");

        assertTrue(registry.isAgent(botDev));
        assertEq(registry.getAgentCount(), 1);
    }

    function test_RegisterCommunity_RevertDuplicate() public {
        vm.prank(botDev);
        registry.registerCommunity("MyBot", "Aggressive");

        vm.prank(botDev);
        vm.expectRevert("AgentRegistry: already registered");
        registry.registerCommunity("MyBot2", "Passive");
    }

    function test_RecordStats() public {
        vm.prank(owner);
        registry.registerOfficial(nexusWallet, "NEXUS", "Nash");

        vm.startPrank(arena);
        registry.recordWin(nexusWallet);
        registry.recordWin(nexusWallet);
        registry.recordLoss(nexusWallet);
        registry.recordDraw(nexusWallet);
        vm.stopPrank();

        (,,,,, uint256 wins, uint256 losses, uint256 draws,) = registry.agents(nexusWallet);
        assertEq(wins, 2);
        assertEq(losses, 1);
        assertEq(draws, 1);
    }

    function test_RecordStats_RevertUnauthorized() public {
        vm.prank(owner);
        registry.registerOfficial(nexusWallet, "NEXUS", "Nash");

        vm.prank(botDev);
        vm.expectRevert("AgentRegistry: not authorized");
        registry.recordWin(nexusWallet);
    }

    function test_DeactivateAgent() public {
        vm.prank(owner);
        registry.registerOfficial(nexusWallet, "NEXUS", "Nash");

        vm.prank(owner);
        registry.deactivateAgent(nexusWallet);

        assertFalse(registry.isAgent(nexusWallet));
    }
}
