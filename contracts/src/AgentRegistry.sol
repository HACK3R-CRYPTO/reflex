// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentRegistry
 * @dev Implementation of EIP-8004: AI Agent Profile Standard
 * This allows agents to register their identity, model details, and capabilities on-chain.
 */
contract AgentRegistry {
    
    struct AgentProfile {
        string name;
        string model;
        string description;
        string metadataUri; // IPFS/Arweave link to extended JSON (traits, tools, etc)
        address owner;
        uint256 registeredAt;
        uint256 gamesPlayed;
        bool active;
    }

    mapping(address => AgentProfile) public agents;
    address[] public allAgents;

    event AgentRegistered(address indexed agentAddress, string name, string model);
    event AgentUpdated(address indexed agentAddress, string name);
    event AgentDeactivated(address indexed agentAddress);
    event AgentStatsUpdated(address indexed agentAddress, uint256 gamesPlayed);

    /**
     * @notice Register or update an agent profile
     * @param _name Name of the AI Agent
     * @param _model The underlying model (e.g. "Nash Equilibrium v1", "GPT-4o")
     * @param _description Purpose and capabilities of the agent
     * @param _metadataUri URI pointing to external metadata
     */
    function registerAgent(
        string calldata _name,
        string calldata _model,
        string calldata _description,
        string calldata _metadataUri
    ) external {
        bool isNew = (agents[msg.sender].owner == address(0));
        
        uint256 existingGames = isNew ? 0 : agents[msg.sender].gamesPlayed;
        uint256 regAt = isNew ? block.timestamp : agents[msg.sender].registeredAt;

        agents[msg.sender] = AgentProfile({
            name: _name,
            model: _model,
            description: _description,
            metadataUri: _metadataUri,
            owner: msg.sender,
            registeredAt: regAt,
            gamesPlayed: existingGames,
            active: true
        });

        if (isNew) {
            allAgents.push(msg.sender);
            emit AgentRegistered(msg.sender, _name, _model);
        } else {
            emit AgentUpdated(msg.sender, _name);
        }
    }

    function incrementGames(address _agent) external {
        // In a production environment, only a authorized platform contract could call this
        // For the hackathon, we can add a check for the ArenaPlatform contract
        agents[_agent].gamesPlayed++;
        emit AgentStatsUpdated(_agent, agents[_agent].gamesPlayed);
    }

    function deactivateAgent() external {
        require(agents[msg.sender].owner == msg.sender, "Not the owner");
        agents[msg.sender].active = false;
        emit AgentDeactivated(msg.sender);
    }

    function getAgent(address _agent) external view returns (AgentProfile memory) {
        return agents[_agent];
    }

    function getAllAgents() external view returns (address[] memory) {
        return allAgents;
    }
}
