// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReflexToken.sol";
import "../src/ReflexPass.sol";

contract ReflexPassTest is Test {
    ReflexToken public rfx;
    ReflexPass public pass;
    address public owner = address(1);
    address public treasury = address(2);
    address public player = address(3);

    function setUp() public {
        rfx = new ReflexToken(owner);
        pass = new ReflexPass(address(rfx), treasury, owner);

        // Give player 200 RFX to mint a pass
        vm.prank(owner);
        rfx.transfer(player, 200 ether);
    }

    function test_MintPass() public {
        vm.startPrank(player);
        rfx.approve(address(pass), 100 ether);
        pass.mint();
        vm.stopPrank();

        assertTrue(pass.hasPass(player));
        assertEq(pass.balanceOf(player), 1);
        assertEq(pass.ownerOf(1), player);
        // 50 RFX burned, 50 RFX to treasury
        assertEq(rfx.balanceOf(treasury), 50 ether);
        assertEq(rfx.balanceOf(player), 100 ether); // 200 - 100 mint cost
    }

    function test_MintPass_RevertAlreadyHasPass() public {
        vm.startPrank(player);
        rfx.approve(address(pass), 200 ether);
        pass.mint();

        vm.expectRevert("RPASS: already has pass");
        pass.mint();
        vm.stopPrank();
    }

    function test_MintPass_RevertInsufficientBalance() public {
        address broke = address(4);
        vm.startPrank(broke);
        rfx.approve(address(pass), 100 ether);
        vm.expectRevert(); // ERC20 insufficient balance
        pass.mint();
        vm.stopPrank();
    }

    function test_TransferUpdatesHasPass() public {
        vm.startPrank(player);
        rfx.approve(address(pass), 100 ether);
        pass.mint();
        vm.stopPrank();

        address buyer = address(5);

        vm.prank(player);
        pass.transferFrom(player, buyer, 1);

        assertFalse(pass.hasPass(player));
        assertTrue(pass.hasPass(buyer));
    }

    function test_SetMintPrice() public {
        vm.prank(owner);
        pass.setMintPrice(50 ether);
        assertEq(pass.mintPrice(), 50 ether);
    }
}
