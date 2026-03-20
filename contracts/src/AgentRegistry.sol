// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentRegistry — On-chain bot identity for NEXUS + community bots
contract AgentRegistry is Ownable {
    struct Agent {
        string name;
        string strategy; // human-readable strategy description
        address wallet;
        bool isOfficial; // true for NEXUS
        bool isActive;
        uint256 wins;
        uint256 losses;
        uint256 draws;
        uint256 registeredAt;
    }

    mapping(address => Agent) public agents;
    address[] public agentList;

    event AgentRegistered(address indexed wallet, string name, bool isOfficial);
    event AgentDeactivated(address indexed wallet);
    event AgentStatsUpdated(address indexed wallet, uint256 wins, uint256 losses, uint256 draws);

    mapping(address => bool) public statUpdaters; // ArenaPlatform

    modifier onlyStatUpdater() {
        require(statUpdaters[msg.sender], "AgentRegistry: not authorized");
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    /// @notice Register an official bot (owner only)
    function registerOfficial(
        address _wallet,
        string calldata _name,
        string calldata _strategy
    ) external onlyOwner {
        require(agents[_wallet].registeredAt == 0, "AgentRegistry: already registered");

        agents[_wallet] = Agent({
            name: _name,
            strategy: _strategy,
            wallet: _wallet,
            isOfficial: true,
            isActive: true,
            wins: 0,
            losses: 0,
            draws: 0,
            registeredAt: block.timestamp
        });
        agentList.push(_wallet);

        emit AgentRegistered(_wallet, _name, true);
    }

    /// @notice Register a community bot (anyone can register their own wallet)
    function registerCommunity(string calldata _name, string calldata _strategy) external {
        require(agents[msg.sender].registeredAt == 0, "AgentRegistry: already registered");

        agents[msg.sender] = Agent({
            name: _name,
            strategy: _strategy,
            wallet: msg.sender,
            isOfficial: false,
            isActive: true,
            wins: 0,
            losses: 0,
            draws: 0,
            registeredAt: block.timestamp
        });
        agentList.push(msg.sender);

        emit AgentRegistered(msg.sender, _name, false);
    }

    function deactivateAgent(address _wallet) external onlyOwner {
        require(agents[_wallet].isActive, "AgentRegistry: not active");
        agents[_wallet].isActive = false;
        emit AgentDeactivated(_wallet);
    }

    function setStatUpdater(address _updater, bool _status) external onlyOwner {
        statUpdaters[_updater] = _status;
    }

    function recordWin(address _wallet) external onlyStatUpdater {
        agents[_wallet].wins++;
        emit AgentStatsUpdated(_wallet, agents[_wallet].wins, agents[_wallet].losses, agents[_wallet].draws);
    }

    function recordLoss(address _wallet) external onlyStatUpdater {
        agents[_wallet].losses++;
        emit AgentStatsUpdated(_wallet, agents[_wallet].wins, agents[_wallet].losses, agents[_wallet].draws);
    }

    function recordDraw(address _wallet) external onlyStatUpdater {
        agents[_wallet].draws++;
        emit AgentStatsUpdated(_wallet, agents[_wallet].wins, agents[_wallet].losses, agents[_wallet].draws);
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    function isAgent(address _wallet) external view returns (bool) {
        return agents[_wallet].registeredAt > 0 && agents[_wallet].isActive;
    }
}
