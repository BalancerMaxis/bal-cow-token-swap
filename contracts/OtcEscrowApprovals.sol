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

    address public receivedToken;
    address public sentToken;
    address public recipient;

    address public beneficiary;
    uint256 public receivedAmount;
    uint256 public sentAmount;

    constructor(
        address beneficiary_,
        address recipient_,
        address receivedToken_,
        address sentToken_,
        uint256 receivedAmount_,
        uint256 sentAmount_
    ) {
        beneficiary = beneficiary_;
        recipient = recipient_;

        receivedToken = receivedToken_;
        sentToken = sentToken_;

        receivedAmount = receivedAmount_;
        sentAmount = sentAmount_;
    }

    modifier onlyApprovedParties() {
        require(msg.sender == recipient || msg.sender == beneficiary);
        _;
    }

    /// @dev Atomically trade specified amount of receivedToken for control over sentToken in vesting contract
    /// @dev Either counterparty may execute swap if sufficient token approvals are given by both parties
    function swap() public onlyApprovedParties {
        // Transfer expected receivedToken from beneficiary
        IERC20(receivedToken).safeTransferFrom(beneficiary, recipient, receivedAmount);

        // Transfer sentToken to beneficiary
        IERC20(sentToken).safeTransferFrom(recipient, beneficiary, sentAmount);
    }
}
