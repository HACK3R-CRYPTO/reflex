// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReflexToken
 * @notice The core platform currency (RFX) for the Reflex gaming ecosystem.
 * @dev Utilizes custom errors and removes redundant modifiers for gas efficiency.
 */
contract ReflexToken is ERC20, ERC20Burnable, Ownable {
    
    // --- Custom Errors ---
    error NotAMinter();
    error ZeroAddress();

    // --- State Variables ---
    mapping(address => bool) public minters;

    // --- Events ---
    event MinterStatusChanged(address indexed account, bool isMinter);

    constructor(address initialOwner) ERC20("Reflex Token", "RFX") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        
        // Mint an initial supply to the owner (treasury) for liquidity and rewards
        // 100M RFX initial supply
        _mint(initialOwner, 100_000_000 * 10 ** decimals());
    }

    /**
     * @dev Gas optimization: Internal function instead of modifier
     * Modifiers copy code to where they are invoked, increasing contract size.
     */
    function _checkMinter() internal view {
        if (owner() != _msgSender() && !minters[_msgSender()]) revert NotAMinter();
    }

    /**
     * @notice Grants or revokes minter privileges for an account
     * @param account The address to update
     * @param status True to grant minter role, false to revoke
     */
    function setMinterStatus(address account, bool status) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        
        minters[account] = status;
        emit MinterStatusChanged(account, status);
    }

    /**
     * @notice Mints new tokens
     * @param to Address to receive the tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _checkMinter();
        if (to == address(0)) revert ZeroAddress();
        
        _mint(to, amount);
    }
}
