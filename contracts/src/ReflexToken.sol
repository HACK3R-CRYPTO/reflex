// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReflexToken (RFX) — The single platform token for Reflex
contract ReflexToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 ether; // 1B RFX

    mapping(address => bool) public minters; // ArenaPlatform, ReflexSwap, etc.

    event MinterUpdated(address indexed account, bool status);

    modifier onlyMinter() {
        require(minters[msg.sender], "RFX: not a minter");
        _;
    }

    constructor(address _owner) ERC20("Reflex Token", "RFX") Ownable(_owner) {
        // Mint initial supply to owner for rewards pool + liquidity
        _mint(_owner, 100_000_000 ether); // 100M initial
    }

    function setMinter(address _minter, bool _status) external onlyOwner {
        minters[_minter] = _status;
        emit MinterUpdated(_minter, _status);
    }

    function mint(address _to, uint256 _amount) external onlyMinter {
        require(totalSupply() + _amount <= MAX_SUPPLY, "RFX: max supply exceeded");
        _mint(_to, _amount);
    }
}
