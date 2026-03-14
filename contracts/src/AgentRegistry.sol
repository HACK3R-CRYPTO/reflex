// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgentRegistry
 * @notice Implementation of EIP-8004: AI Agent Profile Standard
 * @dev Optimized for storage and gas using custom errors.
 */
contract AgentRegistry {
    // --- Custom Errors ---
    error NotOwner();

    // --- Structs ---
    struct AgentProfile {
        address owner;        // 160 bits (Slot 1)
        uint64 registeredAt;  // 64 bits
        bool active;          // 8 bits
        // 24 bits remaining in Slot 1
        
        uint256 gamesPlayed;  // 256 bits (Slot 2)
        
        string name;          // Dynamic
        string model;         // Dynamic
        string description;   // Dynamic
        string metadataUri;   // Dynamic
    }

    // --- State Variables ---
    mapping(address => AgentProfile) public agents;
    address[] public allAgents;

    // --- Events ---
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
        AgentProfile storage profile = agents[msg.sender];
        bool isNew = (profile.owner == address(0));
        
        if (isNew) {
            // New Registration
            profile.owner = msg.sender;
            profile.registeredAt = uint64(block.timestamp);
            profile.active = true;
            
            allAgents.push(msg.sender);
            emit AgentRegistered(msg.sender, _name, _model);
        } else {
            // Update Existing Profile
            emit AgentUpdated(msg.sender, _name);
        }

        profile.name = _name;
        profile.model = _model;
        profile.description = _description;
        profile.metadataUri = _metadataUri;
        // active state and gamesPlayed remain unchanged for updates
    }

    /**
     * @notice Increment the games played counter for an agent
     * @dev Simple increment for now. Should be permissioned to ArenaPlatform in production context.
     * @param _agent Address of the agent
     */
    function incrementGames(address _agent) external {
        // Ideally enforce exactly who can call this (e.g., arena platform)
        // using an access control mechanism. Unchecked is safe here.
        unchecked {
            agents[_agent].gamesPlayed++;
        }
        emit AgentStatsUpdated(_agent, agents[_agent].gamesPlayed);
    }

    /**
     * @notice Deactivate the caller's agent
     */
    function deactivateAgent() external {
        if (agents[msg.sender].owner != msg.sender) revert NotOwner();
        
        agents[msg.sender].active = false;
        emit AgentDeactivated(msg.sender);
    }

    /**
     * @notice Retrieve the profile configuration for an agent
     * @param _agent Address of the agent
     * @return AgentProfile configuration details
     */
    function getAgent(address _agent) external view returns (AgentProfile memory) {
        return agents[_agent];
    }

    /**
     * @notice Retrieve all registered agent addresses
     * @dev Use cautiously. Array can grow unboundedly causing gas/revert out of gas if array is too large.
     */
    function getAllAgents() external view returns (address[] memory) {
        return allAgents;
    }
}
