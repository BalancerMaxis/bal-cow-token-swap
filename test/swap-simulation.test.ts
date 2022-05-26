import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { TestERC20__factory, IERC20, OtcEscrow__factory, OtcEscrow } from "../typechain";
import { BNe18 } from "./utils/numbers";

const BAL_AMOUNT = 100_000;
const AAVE_AMOUNT = 7_000;

describe("Swap Simulation", function () {
  let signer: SignerWithAddress;
  let balancer: SignerWithAddress; // Balancer
  let aave: SignerWithAddress; // Aave
  let balToken: IERC20;
  let aaveToken: IERC20;
  let balAmountWad: BigNumber;
  let aaveAmountWad: BigNumber;
  let otcEscrow: OtcEscrow;

  before(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    balancer = signers[1];
    aave = signers[2];

    const tokenFactory = new TestERC20__factory(signer);
    balToken = await tokenFactory.deploy(balancer.address, BNe18(1_000_000)); // BAL
    aaveToken = await tokenFactory.deploy(aave.address, BNe18(1_000_000)); // AAVE

    balAmountWad = BNe18(BAL_AMOUNT);
    aaveAmountWad = BNe18(AAVE_AMOUNT);
  });

  it("Deploy OtcEscrow", async () => {
    otcEscrow = await new OtcEscrow__factory(signer).deploy(
      balancer.address,
      aave.address,
      balToken.address,
      aaveToken.address,
      balAmountWad,
      aaveAmountWad
    );
  });

  it("First proposal execution: BAL approves spending their token", async () => {
    // This transaction should run in the Balancer proposal
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
  });

  it("Second proposal execution: AAVE transfers tokens and executes the swap", async () => {
    const aavesBALBalanceBefore = await balToken.balanceOf(aave.address);
    const balancersAAVEBalanceBefore = await aaveToken.balanceOf(balancer.address);

    // These are the transactions that should run in the Aave proposal
    await aaveToken.connect(aave).transfer(otcEscrow.address, aaveAmountWad);
    await otcEscrow.connect(aave).swap({ gasLimit: 6000000 });

    // Verifying balances
    const aavesBALBalanceAfter = await balToken.balanceOf(aave.address);
    expect(aavesBALBalanceAfter).to.equal(aavesBALBalanceBefore.add(balAmountWad));

    const balancersAAVEBalanceAfter = await aaveToken.balanceOf(balancer.address);
    expect(balancersAAVEBalanceAfter).to.equal(balancersAAVEBalanceBefore.add(aaveAmountWad));
  });
});
