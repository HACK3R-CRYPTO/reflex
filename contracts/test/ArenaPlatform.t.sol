// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReflexToken.sol";
import "../src/ArenaPlatform.sol";

contract ArenaPlatformTest is Test {
    ReflexToken public rfx;
    ArenaPlatform public arena;

    address owner = address(1);
    address player1 = address(2);
    address player2 = address(3);

    uint96 public constant WAGER = 50 * 10 ** 18; // 50 RFX

    function setUp() public {
        vm.startPrank(owner);
        rfx = new ReflexToken(owner);
        arena = new ArenaPlatform(owner, address(rfx));
        
        // Owner must be set as a minter to mint to players
        rfx.setMinterStatus(owner, true);

        // Give players RFX and approve Arena
        rfx.mint(player1, 1000 * 10 ** 18);
        rfx.mint(player2, 1000 * 10 ** 18);

        vm.stopPrank();

        vm.prank(player1);
        rfx.approve(address(arena), type(uint256).max);

        vm.prank(player2);
        rfx.approve(address(arena), type(uint256).max);
    }

    function test_ProposeMatch() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);

        assertEq(matchId, 0);
        
        // Player 1's tokens should be in the arena now
        assertEq(rfx.balanceOf(address(arena)), WAGER);
    }

    function test_AcceptMatch() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);

        vm.prank(player2);
        arena.acceptMatch(matchId);

        // Both wagers are in the arena
        assertEq(rfx.balanceOf(address(arena)), WAGER * 2);
    }

    function test_FullCommitRevealFlow() public {
        // Setup match
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);

        vm.prank(player2);
        arena.acceptMatch(matchId);

        // 1. Commits
        string memory p1Secret = "secret1";
        uint8 p1Move = 0; // Rock
        bytes32 p1Hash = keccak256(abi.encodePacked(p1Move, p1Secret));

        string memory p2Secret = "secret2";
        uint8 p2Move = 1; // Paper
        bytes32 p2Hash = keccak256(abi.encodePacked(p2Move, p2Secret));

        vm.prank(player1);
        arena.commitMove(matchId, p1Hash);

        vm.prank(player2);
        arena.commitMove(matchId, p2Hash);

        // 2. Reveals
        vm.prank(player1);
        arena.revealMove(matchId, p1Move, p1Secret);

        vm.prank(player2);
        arena.revealMove(matchId, p2Move, p2Secret);

        // 3. Verification (Paper beats Rock, Player 2 wins)
        uint256 totalPool = WAGER * 2;
        uint256 fee = (totalPool * arena.PLATFORM_FEE_BPS()) / 10000;
        uint256 prize = totalPool - fee;

        uint256 expectedTreasuryBalance = (100_000_000 * 10 ** 18) + (fee / 2);
        assertEq(rfx.balanceOf(owner), expectedTreasuryBalance); // Treasury gets half of fee
        assertEq(rfx.balanceOf(player2), 1000 * 10 ** 18 - WAGER + prize);
        
        // P1 lost their wager
        assertEq(rfx.balanceOf(player1), 1000 * 10 ** 18 - WAGER);
    }

    function test_RevertIf_InvalidReveal() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);

        vm.prank(player2);
        arena.acceptMatch(matchId);

        bytes32 fakeHash = keccak256(abi.encodePacked(uint8(0), "wrong_secret"));

        vm.prank(player1);
        arena.commitMove(matchId, fakeHash);

        vm.prank(player1);
        vm.expectRevert(ArenaPlatform.InvalidReveal.selector);
        arena.revealMove(matchId, 0, "secret1");
    }

    function test_CancelMatch() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);

        vm.prank(player1);
        arena.cancelMatch(matchId);

        // Wager returned
        assertEq(rfx.balanceOf(player1), 1000 * 10 ** 18);
        assertEq(rfx.balanceOf(address(arena)), 0);
    }

    function test_TieScenario() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);

        vm.prank(player2);
        arena.acceptMatch(matchId);

        // Both play Rock (Move: 0)
        bytes32 sharedHash = keccak256(abi.encodePacked(uint8(0), "secret"));

        vm.prank(player1);
        arena.commitMove(matchId, sharedHash);

        vm.prank(player2);
        arena.commitMove(matchId, sharedHash);

        vm.prank(player1);
        arena.revealMove(matchId, 0, "secret");

        vm.prank(player2);
        arena.revealMove(matchId, 0, "secret");

        // Both players should have their original balance minus gas (using Prank, so gas not tracked, full 1000 returned)
        assertEq(rfx.balanceOf(player1), 1000 * 10 ** 18);
        assertEq(rfx.balanceOf(player2), 1000 * 10 ** 18);
        assertEq(rfx.balanceOf(owner), 100_000_000 * 10 ** 18); // Treasury gets zero fee on tie
    }

    function test_TicTacToe() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.TicTacToe, WAGER);

        vm.prank(player2);
        arena.acceptMatch(matchId);

        bytes32 p1Hash = keccak256(abi.encodePacked(uint8(4), "s1")); // Center
        bytes32 p2Hash = keccak256(abi.encodePacked(uint8(0), "s2")); // Corner

        vm.prank(player1);
        arena.commitMove(matchId, p1Hash);

        vm.prank(player2);
        arena.commitMove(matchId, p2Hash);

        vm.prank(player1);
        arena.revealMove(matchId, 4, "s1");

        vm.prank(player2);
        arena.revealMove(matchId, 0, "s2");

        // Execution shouldn't revert, winner is pseudo-random based on hash
        ArenaPlatform.MatchStatus status;
        ( , , status, , , , ) = arena.matches(matchId);
        assertEq(uint8(status), uint8(ArenaPlatform.MatchStatus.Completed));
    }

    function test_RevertIf_InvalidMove() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);
        vm.prank(player2);
        arena.acceptMatch(matchId);

        // Valid hash, but the move itself is out of bounds for RPS > 2
        bytes32 fakeHash = keccak256(abi.encodePacked(uint8(3), "secret"));
        vm.prank(player1);
        arena.commitMove(matchId, fakeHash);

        vm.prank(player1);
        vm.expectRevert(ArenaPlatform.InvalidMove.selector);
        arena.revealMove(matchId, 3, "secret");
    }

    function test_RevertIf_AlreadyCommitted() public {
        vm.prank(player1);
        uint256 matchId = arena.proposeMatch(player2, ArenaPlatform.GameType.RockPaperScissors, WAGER);
        vm.prank(player2);
        arena.acceptMatch(matchId);

        bytes32 hash = keccak256(abi.encodePacked(uint8(0), "s"));
        vm.prank(player1);
        arena.commitMove(matchId, hash);

        vm.prank(player1);
        vm.expectRevert(ArenaPlatform.AlreadyCommitted.selector);
        arena.commitMove(matchId, hash);
    }
}
