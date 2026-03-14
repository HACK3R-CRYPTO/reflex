// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReflexToken} from "./ReflexToken.sol";

/**
 * @title ReflexSwap
 * @notice A simple one-way swap from native SOMNI to RFX token for the hackathon.
 * @dev Optimized with Custom Errors and direct un-cached mappings.
 */
contract ReflexSwap is Ownable {
    
    // --- Custom Errors ---
    error ZeroAddress();
    error MustSendNativeToken();
    error ZeroBalance();
    error WithdrawFailed();

    // --- State Variables ---
    ReflexToken public immutable REFLEX_TOKEN;
    uint256 public rate; // How many RFX you get per 1 native token unit

    // --- Events ---
    event SwapFulfilled(address indexed user, uint256 nativeIn, uint256 rfxOut);
    event RateUpdated(uint256 newRate);
    event NativeWithdrawn(address indexed owner, uint256 amount);

    constructor(
        address _reflexTokenAddress, 
        uint256 _rate, 
        address initialOwner
    ) Ownable(initialOwner) {
        if (_reflexTokenAddress == address(0) || initialOwner == address(0)) revert ZeroAddress();
        
        REFLEX_TOKEN = ReflexToken(_reflexTokenAddress);
        rate = _rate;
    }

    /**
     * @notice Swap native token for RFX implicitly
     */
    receive() external payable {
        _swap();
    }

    /**
     * @notice Swap native token for RFX explicitly
     */
    function swap() external payable {
        _swap();
    }

    /**
     * @dev Internal swap logic to prevent code duplication
     */
    function _swap() internal {
        uint256 payment = msg.value;
        if (payment == 0) revert MustSendNativeToken();
        
        // Cache rate to save an SLOAD
        uint256 currentRate = rate;
        uint256 rfxAmount;
        
        unchecked {
            rfxAmount = payment * currentRate;
        }
        
        // Ensure this contract is a minter on ReflexToken
        REFLEX_TOKEN.mint(msg.sender, rfxAmount);

        emit SwapFulfilled(msg.sender, payment, rfxAmount);
    }

    /**
     * @notice Change the conversion rate
     */
    function setRate(uint256 _newRate) external onlyOwner {
        rate = _newRate;
        emit RateUpdated(_newRate);
    }

    /**
     * @notice Withdraw accumulated native tokens to the owner
     */
    function withdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert ZeroBalance();
        
        (bool success, ) = msg.sender.call{value: balance}("");
        if (!success) revert WithdrawFailed();
        
        emit NativeWithdrawn(msg.sender, balance);
    }
}
