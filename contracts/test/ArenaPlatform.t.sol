// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ArenaPlatform.sol";
import "../src/ReflexToken.sol";
import "../src/ReflexPass.sol";
import "../src/AgentRegistry.sol";

contract ArenaPlatformTest is Test {
    ArenaPlatform public arena;
    ReflexToken public rfx;
    ReflexPass public pass;
    AgentRegistry public registry;

    address public owner = address(1);
    address public treasury = address(2);
    address public player = address(3);
    
    // Somnia Precompile address
    address constant SOMNIA_PRECOMPILE = address(0x0100);

    function setUp() public {
        vm.startPrank(owner);
        // Token + Pass
        rfx = new ReflexToken(owner);
        pass = new ReflexPass(address(rfx), treasury, owner);
        
        // Registry
        registry = new AgentRegistry(owner);

        // Arena
        arena = new ArenaPlatform(address(rfx), address(pass), treasury, owner);
        
        // Setup registry for native AI
        arena.setAgentRegistry(address(registry));
        registry.setStatUpdater(address(arena), true);
        registry.registerOfficial(address(arena), "NEXUS", "Native Reactive AI");

        // Fund house with RFX so it can pay out winnings
        rfx.approve(address(arena), 1_000_000 ether);
        arena.fundHouse(1_000_000 ether);

        // Give player RFX and a pass
        rfx.transfer(player, 1000 ether);
        vm.stopPrank();

        vm.startPrank(player);
        rfx.approve(address(pass), 100 ether);
        pass.mint();
        rfx.approve(address(arena), type(uint256).max);
        vm.stopPrank();
    }

    // Helper to simulate a Somnia Reactivity Event dispatching to our contract
    function simulateSomniaEvent(uint256 matchId, address p, uint8 move, uint256 wager, ArenaPlatform.GameType gameType) internal {
        bytes32[] memory topics = new bytes32[](6);
        topics[0] = keccak256("PlayerMoved(uint256,address,uint8)");
        topics[1] = bytes32(matchId);
        topics[2] = bytes32(uint256(uint160(p)));
        
        bytes memory data = abi.encode(move, wager, uint8(gameType));
        
        vm.prank(SOMNIA_PRECOMPILE);
        arena.onEvent(address(arena), topics, data);
    }

    function test_CoinFlip_PlayerWinsTies() public {
        vm.startPrank(player);
        uint256 wager = 10 ether;
        uint256 matchId = arena.playAgainstAI(ArenaPlatform.GameType.CoinFlip, wager, 0); // guess Heads
        vm.stopPrank();

        vm.prevrandao(bytes32(uint256(777)));
        
        uint256 expectedRandomWord = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    block.number,
                    matchId,
                    address(arena)
                )
            )
        );
        uint8 expectedAiMove = uint8(expectedRandomWord % 2);

        simulateSomniaEvent(matchId, player, 0, wager, ArenaPlatform.GameType.CoinFlip);

        (,,,, bool resolved,) = arena.getMatch(matchId);
        assertTrue(resolved, "Match should be resolved");
        
        if (expectedAiMove == 0) {
            // Player guessed Heads (0), AI flipped Heads (0). Tie -> Player Wins!
            assertEq(rfx.balanceOf(player), 900 ether - wager + 19.2 ether, "Payout missing for tied coin flip");
        } else {
            // AI flipped Tails (1). Player lost.
            assertEq(rfx.balanceOf(player), 900 ether - wager, "Wager not deducted for losing coin flip");
        }
    }
    
    function test_RockPaperScissors() public {
        vm.startPrank(player);
        uint256 wager = 10 ether;
        uint256 matchId = arena.playAgainstAI(ArenaPlatform.GameType.RockPaperScissors, wager, 2); // Scissors
        vm.stopPrank();

        vm.prevrandao(bytes32(uint256(777)));
        
        uint256 expectedRandomWord = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    block.number,
                    matchId,
                    address(arena)
                )
            )
        );
        uint8 expectedAiMove = uint8(expectedRandomWord % 3);

        simulateSomniaEvent(matchId, player, 2, wager, ArenaPlatform.GameType.RockPaperScissors);

        (,,,, bool resolved,) = arena.getMatch(matchId);
        assertTrue(resolved, "Match should be resolved");
        
        if (expectedAiMove == 0) {
            // Scissors vs Rock -> AI Wins
            assertEq(rfx.balanceOf(player), 900 ether - wager, "AI should have won");
        } else if (expectedAiMove == 1) {
            // Scissors vs Paper -> Player Wins
            assertEq(rfx.balanceOf(player), 900 ether - wager + 19.2 ether, "Player should have won");
        } else {
            // Scissors vs Scissors -> Tie -> Player Wins (Universal Tie Rule!)
            assertEq(rfx.balanceOf(player), 900 ether - wager + 19.2 ether, "Player takes pot on tie!");
        }
    }

    // A simpler test just to guarantee AI can win depending on the roll
    function test_DiceRoll() public {
        vm.startPrank(player);
        uint256 wager = 10 ether;
        uint256 matchId = arena.playAgainstAI(ArenaPlatform.GameType.DiceRoll, wager, 3); // Rolls a 3
        vm.stopPrank();

        vm.prevrandao(bytes32(uint256(12345)));
        
        uint256 expectedRandomWord = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    block.number,
                    matchId,
                    address(arena)
                )
            )
        );
        uint8 expectedAiMove = uint8((expectedRandomWord % 6) + 1);

        simulateSomniaEvent(matchId, player, 3, wager, ArenaPlatform.GameType.DiceRoll);

        if (expectedAiMove >= 4) {
            // AI rolled 4,5,6 -> AI wins
            assertEq(rfx.balanceOf(player), 900 ether - wager, "AI wins dice roll");
        } else {
            // AI rolled 1,2 -> Player wins. AI rolled 3 -> Tie -> Player wins
            assertEq(rfx.balanceOf(player), 900 ether - wager + 19.2 ether, "Player wins dice roll");
        }
    }
}
