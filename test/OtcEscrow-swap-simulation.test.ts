import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { TestERC20__factory, OtcEscrow__factory, OtcEscrow, TestERC20 } from "../typechain";
import { BNe18 } from "./utils/numbers";

const BAL_AMOUNT = 100_000;
const AAVE_AMOUNT = 7_000;

describe("OtcEscrow Swap Simulation", function () {
  let signer: SignerWithAddress;
  let balancer: SignerWithAddress; // Balancer
  let aave: SignerWithAddress; // Aave
  let balToken: TestERC20;
  let aaveToken: TestERC20;
  let balAmountWad: BigNumber;
  let aaveAmountWad: BigNumber;
  let otcEscrow: OtcEscrow;

  before(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    balancer = signers[1];
    aave = signers[2];
    balAmountWad = BNe18(BAL_AMOUNT);
    aaveAmountWad = BNe18(AAVE_AMOUNT);

    const tokenFactory = new TestERC20__factory(signer);
    balToken = await tokenFactory.deploy("Balancer Token", "BAL");
    aaveToken = await tokenFactory.deploy("Aave Token", "AAVE");

    balToken.mint(balancer.address, balAmountWad);
    aaveToken.mint(aave.address, aaveAmountWad);
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
    await otcEscrow.connect(aave).swap();

    // Verifying balances
    const aavesBALBalanceAfter = await balToken.balanceOf(aave.address);
    expect(aavesBALBalanceAfter).to.equal(aavesBALBalanceBefore.add(balAmountWad));

    const balancersAAVEBalanceAfter = await aaveToken.balanceOf(balancer.address);
    expect(balancersAAVEBalanceAfter).to.equal(balancersAAVEBalanceBefore.add(aaveAmountWad));
  });
});
