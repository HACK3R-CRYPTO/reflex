// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReactiveLeaderboard.sol";

contract ReactiveLeaderboardTest is Test {
    ReactiveLeaderboard public leaderboard;

    // The Somnia Reactivity Precompile address — only it can call onEvent
    address constant PRECOMPILE = address(0x0100);

    address owner   = address(this);
    address player1 = address(1);
    address player2 = address(2);

    // A mock ArenaPlatform address that the leaderboard listens to
    address mockArena = address(0xABCD);

    function setUp() public {
        leaderboard = new ReactiveLeaderboard(mockArena);
    }

    // Encode a MatchCompleted event payload the same way ABI does
    // event MatchCompleted(uint256 indexed matchId, address challenger, address opponent, address winner, uint256 prize)
    function _encodeMatchCompleted(
        uint256 matchId,
        address challenger,
        address opponent,
        address winner,
        uint256 prize
    ) internal pure returns (bytes32[] memory topics, bytes memory data) {
        topics = new bytes32[](2);
        topics[0] = keccak256("MatchCompleted(uint256,address,address,address,uint256)");
        topics[1] = bytes32(matchId); // matchId is indexed

        data = abi.encode(challenger, opponent, winner, prize);
    }

    function test_ProcessMatchResult_WinLoss() public {
        address challenger = player1;
        address opponent   = player2;
        address winner     = player1;
        uint256 prize      = 100;
        uint256 matchId    = 1;

        (bytes32[] memory topics, bytes memory data) =
            _encodeMatchCompleted(matchId, challenger, opponent, winner, prize);

        // Simulate the Somnia precompile calling onEvent
        vm.prank(PRECOMPILE);
        leaderboard.onEvent(mockArena, topics, data);

        ReactiveLeaderboard.PlayerStats memory p1Stats = leaderboard.getPlayerStats(player1);
        assertEq(p1Stats.wins, 1);
        assertEq(p1Stats.losses, 0);
        assertEq(p1Stats.ties, 0);
        assertEq(p1Stats.totalEarnings, 100);
        assertEq(p1Stats.score, 50); // 50 points per win

        ReactiveLeaderboard.PlayerStats memory p2Stats = leaderboard.getPlayerStats(player2);
        assertEq(p2Stats.wins, 0);
        assertEq(p2Stats.losses, 1);
        assertEq(p2Stats.ties, 0);
        assertEq(p2Stats.totalEarnings, 0);

        address[] memory known = leaderboard.getAllKnownPlayers();
        assertEq(known.length, 2);
    }

    function test_ProcessMatchResult_Tie() public {
        address challenger = player1;
        address opponent   = player2;
        address winner     = address(0); // tie
        uint256 prize      = 0;
        uint256 matchId    = 2;

        (bytes32[] memory topics, bytes memory data) =
            _encodeMatchCompleted(matchId, challenger, opponent, winner, prize);

        vm.prank(PRECOMPILE);
        leaderboard.onEvent(mockArena, topics, data);

        ReactiveLeaderboard.PlayerStats memory p1Stats = leaderboard.getPlayerStats(player1);
        assertEq(p1Stats.wins, 0);
        assertEq(p1Stats.ties, 1);
        assertEq(p1Stats.totalEarnings, 0);

        ReactiveLeaderboard.PlayerStats memory p2Stats = leaderboard.getPlayerStats(player2);
        assertEq(p2Stats.ties, 1);
    }

    function test_RevertIf_CalledByNonPrecompile() public {
        address challenger = player1;
        address opponent   = player2;
        address winner     = player1;

        (bytes32[] memory topics, bytes memory data) =
            _encodeMatchCompleted(1, challenger, opponent, winner, 100);

        // Should revert — only 0x0100 can call onEvent
        vm.expectRevert();
        leaderboard.onEvent(mockArena, topics, data);
    }

    function test_RevertIf_WrongEmitter() public {
        address wrongArena = address(0xDEAD);
        address challenger = player1;
        address opponent   = player2;
        address winner     = player1;

        (bytes32[] memory topics, bytes memory data) =
            _encodeMatchCompleted(1, challenger, opponent, winner, 100);

        vm.prank(PRECOMPILE);
        vm.expectRevert(ReactiveLeaderboard.WrongEmitter.selector);
        leaderboard.onEvent(wrongArena, topics, data);
    }

    function test_SubmitSoloScore() public {
        leaderboard.submitSoloScore(player1, 500);
        leaderboard.submitSoloScore(player1, 200);

        ReactiveLeaderboard.PlayerStats memory p1Stats = leaderboard.getPlayerStats(player1);
        assertEq(p1Stats.score, 700);

        address[] memory known = leaderboard.getAllKnownPlayers();
        assertEq(known.length, 1);
        assertEq(known[0], player1);
    }

    function test_RevertIf_SubmitSoloScoreZeroAddress() public {
        vm.expectRevert(ReactiveLeaderboard.InvalidAddress.selector);
        leaderboard.submitSoloScore(address(0), 100);
    }
}
