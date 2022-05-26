// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TestERC20 is ERC20Permit {
    constructor(address tokenOwner, uint256 amountToMint) ERC20("Test ERC20", "TEST") ERC20Permit("Test ERC20") {
        _mint(tokenOwner, amountToMint);
    }
}
