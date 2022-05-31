import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  TestERC20__factory,
  TestERC20,
  OtcEscrowApprovals,
  OtcEscrowApprovals__factory,
} from "../typechain";
import { BNe18 } from "./utils/numbers";

const BAL_AMOUNT = 100_000;
const AAVE_AMOUNT = 7_000;

describe("OtcEscrowApprovals Swap Simulation", function () {
  let signer: SignerWithAddress;
  let balancer: SignerWithAddress;
  let aave: SignerWithAddress;
  let balToken: TestERC20;
  let aaveToken: TestERC20;
  let balAmountWad: BigNumber;
  let aaveAmountWad: BigNumber;
  let otcEscrow: OtcEscrowApprovals;
  let anyone: SignerWithAddress;

  before(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    balancer = signers[1];
    aave = signers[2];
    anyone = signers[3];
    balAmountWad = BNe18(BAL_AMOUNT);
    aaveAmountWad = BNe18(AAVE_AMOUNT);

    const tokenFactory = new TestERC20__factory(signer);
    balToken = await tokenFactory.deploy("Balancer Token", "BAL");
    aaveToken = await tokenFactory.deploy("Aave Token", "AAVE");

    balToken.mint(balancer.address, balAmountWad);
    aaveToken.mint(aave.address, aaveAmountWad);
  });

  it("Deploy OtcEscrowApprovals", async () => {
    otcEscrow = await new OtcEscrowApprovals__factory(signer).deploy(
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

  it("Second proposal execution: AAVE approves spending their token", async () => {
    await aaveToken.connect(aave).approve(otcEscrow.address, aaveAmountWad);
  });

  it("Llama swap execution (anyone can execute)", async () => {
    const aavesBALBalanceBefore = await balToken.balanceOf(aave.address);
    const balancersAAVEBalanceBefore = await aaveToken.balanceOf(balancer.address);

    await expect(otcEscrow.connect(anyone).swap())
      .to.emit(otcEscrow, "Swap")
      .withArgs(balAmountWad, aaveAmountWad);

    // Verifying balances
    const aavesBALBalanceAfter = await balToken.balanceOf(aave.address);
    expect(aavesBALBalanceAfter).to.equal(aavesBALBalanceBefore.add(balAmountWad));

    const balancersAAVEBalanceAfter = await aaveToken.balanceOf(balancer.address);
    expect(balancersAAVEBalanceAfter).to.equal(balancersAAVEBalanceBefore.add(aaveAmountWad));
  });
});
