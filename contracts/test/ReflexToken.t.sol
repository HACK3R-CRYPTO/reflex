// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReflexToken.sol";

contract ReflexTokenTest is Test {
    ReflexToken public rfx;
    address public owner = address(1);
    address public minter = address(2);
    address public user = address(3);

    function setUp() public {
        rfx = new ReflexToken(owner);
    }

    function test_InitialState() public view {
        assertEq(rfx.name(), "Reflex Token");
        assertEq(rfx.symbol(), "RFX");
        assertEq(rfx.totalSupply(), 100_000_000 ether);
        assertEq(rfx.balanceOf(owner), 100_000_000 ether);
        assertEq(rfx.MAX_SUPPLY(), 1_000_000_000 ether);
    }

    function test_SetMinter() public {
        vm.prank(owner);
        rfx.setMinter(minter, true);
        assertTrue(rfx.minters(minter));
    }

    function test_SetMinter_RevertNonOwner() public {
        vm.prank(user);
        vm.expectRevert();
        rfx.setMinter(minter, true);
    }

    function test_Mint() public {
        vm.prank(owner);
        rfx.setMinter(minter, true);

        vm.prank(minter);
        rfx.mint(user, 1000 ether);
        assertEq(rfx.balanceOf(user), 1000 ether);
    }

    function test_Mint_RevertNotMinter() public {
        vm.prank(user);
        vm.expectRevert("RFX: not a minter");
        rfx.mint(user, 1000 ether);
    }

    function test_Mint_RevertMaxSupply() public {
        vm.prank(owner);
        rfx.setMinter(minter, true);

        vm.prank(minter);
        vm.expectRevert("RFX: max supply exceeded");
        rfx.mint(user, 901_000_000 ether); // 100M initial + 901M > 1B
    }

    function test_Burn() public {
        vm.prank(owner);
        rfx.burn(1000 ether);
        assertEq(rfx.balanceOf(owner), 100_000_000 ether - 1000 ether);
    }
}
