// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRFX {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function mint(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IReflexPass {
    function hasPass(address user) external view returns (bool);
}

interface IAgentRegistry {
    function isAgent(address wallet) external view returns (bool);
    function recordWin(address wallet) external;
    function recordLoss(address wallet) external;
    function recordDraw(address wallet) external;
}

interface IReactiveLeaderboard {
    function recordPvPResult(address winner, address loser, uint256 wager) external;
    function recordPvPDraw(address player1, address player2) external;
    function submitSoloScore(address player, uint256 score, uint8 gameType) external;
}
