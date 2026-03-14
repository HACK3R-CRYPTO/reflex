// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReflexPass
 * @notice ERC721 NFT serving as an access pass for Reflex PvP arena.
 * @dev Optimized with custom errors, SafeERC20, and immutable variables.
 */
contract ReflexPass is ERC721, Ownable {
    using SafeERC20 for IERC20;

    // --- Custom Errors ---
    error ZeroAddress();
    error MintPriceNotMet();

    // --- State Variables ---
    // Immutable variables save significant access gas
    IERC20 public immutable REFLEX_TOKEN;
    
    uint256 private _nextTokenId = 1; // Explicit start from 1
    uint256 public mintPrice;

    // --- Events ---
    event PassMinted(address indexed to, uint256 indexed tokenId);
    event MintPriceUpdated(uint256 newPrice);

    constructor(
        address _reflexTokenAddress, 
        uint256 _mintPrice, 
        address initialOwner
    ) ERC721("Reflex Pass", "RFXP") Ownable(initialOwner) {
        if (_reflexTokenAddress == address(0) || initialOwner == address(0)) revert ZeroAddress();
        
        REFLEX_TOKEN = IERC20(_reflexTokenAddress);
        mintPrice = _mintPrice;
    }

    /**
     * @notice Updates the RFX token cost to mint a pass
     */
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
        emit MintPriceUpdated(_newPrice);
    }

    /**
     * @notice Mints a new ReflexPass to the sender
     * @dev Deducts the mintPrice in RFX from the sender's wallet
     */
    function mint() external {
        uint256 currentPrice = mintPrice; // Cache in memory

        // Transfer tokens to the treasury (contract owner)
        // SafeERC20 handles non-standard ERC20 return boolean values
        REFLEX_TOKEN.safeTransferFrom(msg.sender, owner(), currentPrice);

        uint256 tokenId;
        // Unchecked increment since we will never mint near 2^256 NFTs
        unchecked {
            tokenId = _nextTokenId++;
        }
        
        _safeMint(msg.sender, tokenId);
        emit PassMinted(msg.sender, tokenId);
    }

    /**
     * @notice Helper view to determine if a user holds at least one pass
     */
    function hasPass(address _user) external view returns (bool) {
        return balanceOf(_user) > 0;
    }

    /**
     * @notice Returns the total number of passes minted
     */
    function totalMinted() external view returns (uint256) {
        unchecked {
            return _nextTokenId - 1;
        }
    }
}
