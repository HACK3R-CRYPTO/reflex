// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IReflex.sol";

/// @title ReflexPass — ERC-721 NFT platform access key
contract ReflexPass is ERC721, Ownable {
    IRFX public immutable rfxToken;

    uint256 public mintPrice = 100 ether; // 100 RFX
    uint256 public nextTokenId = 1;
    address public treasury;

    mapping(address => bool) public hasPass;

    event PassMinted(address indexed player, uint256 tokenId);
    event MintPriceUpdated(uint256 newPrice);

    constructor(
        address _rfxToken,
        address _treasury,
        address _owner
    ) ERC721("Reflex Pass", "RPASS") Ownable(_owner) {
        rfxToken = IRFX(_rfxToken);
        treasury = _treasury;
    }

    function mint() external {
        require(!hasPass[msg.sender], "RPASS: already has pass");

        // Collect RFX payment: 50% burned, 50% treasury
        uint256 burnAmount = mintPrice / 2;
        uint256 treasuryAmount = mintPrice - burnAmount;

        rfxToken.transferFrom(msg.sender, address(this), mintPrice);
        rfxToken.burn(burnAmount);
        rfxToken.transfer(treasury, treasuryAmount);

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        hasPass[msg.sender] = true;

        emit PassMinted(msg.sender, tokenId);
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
        emit MintPriceUpdated(_price);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    /// @dev Track pass ownership on transfer
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = super._update(to, tokenId, auth);
        if (from != address(0)) hasPass[from] = false;
        if (to != address(0)) hasPass[to] = true;
        return from;
    }
}
