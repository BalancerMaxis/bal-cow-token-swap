// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/*
    OtcEscrowApprovals.sol is a fork of:
    https://github.com/fei-protocol/fei-protocol-core/blob/339b2f71e9fda31df628d5e17dd3e4482c91d088/contracts/utils/OtcEscrow.sol

    It uses only ERC20 approvals, without transfering any tokens to this contract as part of the swap.
    It assumes both parties have approved it to spend the appropriate amounts ahead of calling swap().

    To revoke the swap, any party can remove the approval granted to this contract and the swap will fail.
*/
contract OtcEscrowApprovals {
    using SafeERC20 for IERC20;

    address public immutable balancerDAO;
    address public immutable cowDAO;
    address public immutable cowDestination;

    address public immutable balToken;
    address public immutable cowToken;

    uint256 public immutable balAmount;
    uint256 public immutable cowAmount;

    bool public hasSwapOccurred;

    event Swap(uint256 balAmount, uint256 cowAmount);

    error SwapAlreadyOccurred();

    constructor(
        address balancerDAO_,
        address cowDAO_,
        address cowDestination_,
        address balToken_,
        address cowToken_,
        uint256 balAmount_,
        uint256 cowAmount_
    ) {
        require(balancerDAO_ != address(0), "Invalid balancerDAO address");
        require(cowDAO_ != address(0), "Invalid cowDAO address");
        require(cowDestination_ != address(0), "Invalid cowDestination address");
        require(balToken_ != address(0), "Invalid BAL token address");
        require(cowToken_ != address(0), "Invalid COW token address");
        require(balAmount_ > 0, "BAL amount must be greater than 0");
        require(cowAmount_ > 0, "COW amount must be greater than 0");

        balancerDAO = balancerDAO_;
        cowDAO = cowDAO_;
        cowDestination = cowDestination_;

        balToken = balToken_;
        cowToken = cowToken_;

        balAmount = balAmount_;
        cowAmount = cowAmount_;
    }

    /// @dev Atomically trade specified amounts of BAL token and COW token
    /// @dev Anyone may execute the swap if sufficient token approvals are given by both parties
    function swap() external {
        // Check in case of infinite approvals and prevent a second swap
        if (hasSwapOccurred) revert SwapAlreadyOccurred();
        hasSwapOccurred = true;

        // Transfer expected receivedToken from beneficiary
        IERC20(balToken).safeTransferFrom(balancerDAO, cowDestination, balAmount);

        // Transfer sentToken to beneficiary
        IERC20(cowToken).safeTransferFrom(cowDAO, balancerDAO, cowAmount);

        emit Swap(balAmount, cowAmount);
    }
}
