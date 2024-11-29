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

const BAL_AMOUNT = 250_000;
const COW_AMOUNT = 1_481_949;

describe("OtcEscrowApprovals Swap Simulation", function () {
  let signer: SignerWithAddress;
  let balancer: SignerWithAddress;
  let cow: SignerWithAddress;
  let balToken: TestERC20;
  let cowToken: TestERC20;
  let balAmountWad: BigNumber;
  let cowAmountWad: BigNumber;
  let otcEscrow: OtcEscrowApprovals;
  let anyone: SignerWithAddress;

  before(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    balancer = signers[1];
    cow = signers[2];
    anyone = signers[3];
    balAmountWad = BNe18(BAL_AMOUNT);
    cowAmountWad = BNe18(COW_AMOUNT);

    const tokenFactory = new TestERC20__factory(signer);
    balToken = await tokenFactory.deploy("Balancer Token", "BAL");
    cowToken = await tokenFactory.deploy("Cow Token", "COW");

    balToken.mint(balancer.address, balAmountWad);
    cowToken.mint(cow.address, cowAmountWad);
  });

  it("Deploy OtcEscrowApprovals", async () => {
    otcEscrow = await new OtcEscrowApprovals__factory(signer).deploy(
      balancer.address,
      cow.address,
      balToken.address,
      cowToken.address,
      balAmountWad,
      cowAmountWad
    );
  });

  it("First proposal execution: BAL approves spending their token", async () => {
    // This transaction should run in the Balancer proposal
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
  });

  it("Second proposal execution: COW approves spending their token", async () => {
    await cowToken.connect(cow).approve(otcEscrow.address, cowAmountWad);
  });

  it("Llama swap execution (anyone can execute)", async () => {
    const cowsBALBalanceBefore = await balToken.balanceOf(cow.address);
    const balancersCOWBalanceBefore = await cowToken.balanceOf(balancer.address);

    await expect(otcEscrow.connect(anyone).swap())
      .to.emit(otcEscrow, "Swap")
      .withArgs(balAmountWad, cowAmountWad);

    // Verifying balances
    const cowsBALBalanceAfter = await balToken.balanceOf(cow.address);
    expect(cowsBALBalanceAfter).to.equal(cowsBALBalanceBefore.add(balAmountWad));

    const balancersCOWBalanceAfter = await cowToken.balanceOf(balancer.address);
    expect(balancersCOWBalanceAfter).to.equal(balancersCOWBalanceBefore.add(cowAmountWad));
  });
});
