// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReflexToken.sol";
import "../src/ReflexSwap.sol";

contract ReflexSwapTest is Test {
    ReflexToken public rfx;
    ReflexSwap public swap;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        rfx = new ReflexToken(owner);
        swap = new ReflexSwap(address(rfx), owner);

        // Authorize swap as minter
        vm.prank(owner);
        rfx.setMinter(address(swap), true);

        // Fund user with native tokens
        vm.deal(user, 100 ether);
    }

    function test_Swap() public {
        vm.prank(user);
        swap.swap{value: 1 ether}();

        assertEq(rfx.balanceOf(user), 1000 ether); // 1 SOMNI * 1000 rate
        assertEq(address(swap).balance, 1 ether);
    }

    function test_Swap_RevertZeroValue() public {
        vm.prank(user);
        vm.expectRevert("Swap: zero value");
        swap.swap{value: 0}();
    }

    function test_Swap_RevertWhenPaused() public {
        vm.prank(owner);
        swap.setPaused(true);

        vm.prank(user);
        vm.expectRevert("Swap: paused");
        swap.swap{value: 1 ether}();
    }

    function test_SetRate() public {
        vm.prank(owner);
        swap.setRate(2000);
        assertEq(swap.rate(), 2000);

        vm.prank(user);
        swap.swap{value: 1 ether}();
        assertEq(rfx.balanceOf(user), 2000 ether);
    }

    function test_Withdraw() public {
        vm.prank(user);
        swap.swap{value: 5 ether}();

        uint256 ownerBalBefore = owner.balance;
        vm.prank(owner);
        swap.withdraw(owner);
        assertEq(owner.balance, ownerBalBefore + 5 ether);
    }

    function test_Withdraw_RevertNonOwner() public {
        vm.prank(user);
        swap.swap{value: 1 ether}();

        vm.prank(user);
        vm.expectRevert();
        swap.withdraw(user);
    }
}
