// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IReflex.sol";

/// @title ReflexSwap — Swap native SOMNI tokens for RFX
contract ReflexSwap is Ownable, ReentrancyGuard {
    IRFX public immutable rfxToken;

    uint256 public rate = 1000; // 1 SOMNI = 1000 RFX
    bool public paused;

    event Swapped(address indexed user, uint256 somniAmount, uint256 rfxAmount);
    event RateUpdated(uint256 newRate);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address _rfxToken, address _owner) Ownable(_owner) {
        rfxToken = IRFX(_rfxToken);
    }

    /// @notice Swap native SOMNI for RFX tokens
    function swap() external payable nonReentrant {
        require(!paused, "Swap: paused");
        require(msg.value > 0, "Swap: zero value");

        uint256 rfxAmount = msg.value * rate;
        rfxToken.mint(msg.sender, rfxAmount);

        emit Swapped(msg.sender, msg.value, rfxAmount);
    }

    function setRate(uint256 _rate) external onlyOwner {
        require(_rate > 0, "Swap: zero rate");
        rate = _rate;
        emit RateUpdated(_rate);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function withdraw(address _to) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Swap: no balance");
        (bool success, ) = _to.call{value: balance}("");
        require(success, "Swap: transfer failed");
        emit Withdrawn(_to, balance);
    }
}
