// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReactiveLeaderboard.sol";

contract ReactiveLeaderboardTest is Test {
    ReactiveLeaderboard public leaderboard;

    address owner = address(this);
    address player1 = address(1);
    address player2 = address(2);

    function setUp() public {
        leaderboard = new ReactiveLeaderboard();
    }
    function test_ProcessMatchResult_WinLoss() public {
        // simulate AI Agent calling recordMatchResult
        // MatchCompleted(matchId, challenger, opponent, winner, prize)
        address winner = player1;
        address loser = player2;
        address challenger = player1;
        address opponent = player2;
        uint256 prize = 100;

        leaderboard.setAuthorizedUpdater(owner);
        leaderboard.recordMatchResult(winner, loser, challenger, opponent, prize, false);

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
        
        // Verify Known Players
        address[] memory known = leaderboard.getAllKnownPlayers();
        assertEq(known.length, 2);
    }

    function test_ProcessMatchResult_Tie() public {
        address winner = address(0);
        address loser = address(0);
        address challenger = player1;
        address opponent = player2;
        uint256 prize = 0;

        leaderboard.setAuthorizedUpdater(owner);
        leaderboard.recordMatchResult(winner, loser, challenger, opponent, prize, true);

        ReactiveLeaderboard.PlayerStats memory p1Stats = leaderboard.getPlayerStats(player1);
        assertEq(p1Stats.wins, 0);
        assertEq(p1Stats.ties, 1);
        assertEq(p1Stats.totalEarnings, 0);
        assertEq(p1Stats.score, 0);

        ReactiveLeaderboard.PlayerStats memory p2Stats = leaderboard.getPlayerStats(player2);
        assertEq(p2Stats.ties, 1);
    }

    function test_SubmitSoloScore() public {
        // player1 scores 500 in Rhythm Game
        leaderboard.submitSoloScore(player1, 500);
        
        // player1 scores another 200
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
