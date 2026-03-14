// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReflexToken.sol";
import "../src/ReflexPass.sol";
import "../src/ReflexSwap.sol";

contract ReflexEconomyTest is Test {
    ReflexToken public rfx;
    ReflexPass public pass;
    ReflexSwap public swap;

    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);

    uint256 public constant MINT_PRICE = 10 * 10 ** 18; // 10 RFX
    uint256 public constant SWAP_RATE = 100; // 1 SOMNI = 100 RFX

    function setUp() public {
        vm.startPrank(owner);

        // Deploy Token
        rfx = new ReflexToken(owner);

        // Deploy Pass
        pass = new ReflexPass(address(rfx), MINT_PRICE, owner);

        // Deploy Swap
        swap = new ReflexSwap(address(rfx), SWAP_RATE, owner);

        // Setup minter roles
        rfx.setMinterStatus(address(swap), true);
        rfx.setMinterStatus(owner, true);

        vm.stopPrank();
        
        // Fund users with native token (SOMNI replica)
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function test_InitialSupply() public view {
        assertEq(rfx.balanceOf(owner), 100_000_000 * 10 ** 18);
    }

    function test_SwapNativeForRFX() public {
        vm.startPrank(user1);
        
        uint256 swapAmount = 1 ether;
        swap.swap{value: swapAmount}();

        assertEq(rfx.balanceOf(user1), swapAmount * SWAP_RATE);
        assertEq(address(swap).balance, swapAmount);
        
        vm.stopPrank();
    }

    function test_RevertIf_SwapZeroNative() public {
        vm.startPrank(user1);
        vm.expectRevert();
        swap.swap{value: 0}();
        vm.stopPrank();
    }

    function test_MintReflexPass() public {
        // 1. User gets RFX via swap
        vm.prank(user1);
        swap.swap{value: 1 ether}();

        // 2. User approves RFX to Pass contract
        vm.startPrank(user1);
        rfx.approve(address(pass), MINT_PRICE);

        // 3. User mints pass
        pass.mint();
        vm.stopPrank();

        assertEq(pass.balanceOf(user1), 1);
        assertEq(pass.hasPass(user1), true);
        assertEq(pass.totalMinted(), 1);
        
        // Treasury (owner) should receive the RFX
        assertEq(rfx.balanceOf(owner), 100_000_000 * 10 ** 18 + MINT_PRICE);
    }

    function test_RevertIf_MintPassWithoutApproval() public {
        vm.startPrank(user1);
        swap.swap{value: 1 ether}();
        vm.expectRevert();
        pass.mint();
        vm.stopPrank();
    }

    function test_RevertIf_MintPassWithoutFunds() public {
        vm.startPrank(user1);
        rfx.approve(address(pass), MINT_PRICE);
        vm.expectRevert();
        pass.mint();
        vm.stopPrank();
    }
}
