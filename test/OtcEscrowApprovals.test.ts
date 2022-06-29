import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import hardhat from "hardhat";
import {
  OtcEscrowApprovals,
  OtcEscrowApprovals__factory,
  TestERC20,
  TestERC20__factory,
} from "../typechain";
import { BNe18 } from "./utils/numbers";
chai.use(solidity);
const { expect } = chai;
const { ethers } = hardhat;

describe("OtcEscrowApprovals", () => {
  let snapshotId: number;
  let signer: SignerWithAddress;
  let balancer: SignerWithAddress;
  let aave: SignerWithAddress;
  let balToken: TestERC20;
  let aaveToken: TestERC20;
  let balAmountWad: BigNumber;
  let aaveAmountWad: BigNumber;
  let otcEscrow: OtcEscrowApprovals;

  before(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    balancer = signers[1];
    aave = signers[2];
    balAmountWad = BNe18(1_000_000);
    aaveAmountWad = BNe18(1_000_000);

    const tokenFactory = new TestERC20__factory(signer);
    balToken = await tokenFactory.deploy("Balancer Token", "BAL");
    aaveToken = await tokenFactory.deploy("Aave Token", "AAVE");

    balToken.mint(balancer.address, balAmountWad);
    aaveToken.mint(aave.address, aaveAmountWad);

    otcEscrow = await new OtcEscrowApprovals__factory(signer).deploy(
      balancer.address,
      aave.address,
      balToken.address,
      aaveToken.address,
      balAmountWad,
      aaveAmountWad
    );
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it("swap fails before any approvals", async () => {
    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap fails when balancer never approves", async () => {
    await aaveToken.connect(aave).approve(otcEscrow.address, aaveAmountWad);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap fails when aave never approves", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap fails when balancer revokes approval", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
    await aaveToken.connect(aave).approve(otcEscrow.address, aaveAmountWad);

    await balToken.connect(balancer).approve(otcEscrow.address, 0);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap fails when aave revokes approval", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
    await aaveToken.connect(aave).approve(otcEscrow.address, aaveAmountWad);

    await aaveToken.connect(aave).approve(otcEscrow.address, 0);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap works and emits given sufficient approvals", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
    await aaveToken.connect(aave).approve(otcEscrow.address, aaveAmountWad);

    await expect(otcEscrow.swap()).to.emit(otcEscrow, "Swap").withArgs(balAmountWad, aaveAmountWad);
  });

  it("swap fails when tried to execute for more than one time", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, BNe18(10_000_000));
    await aaveToken.connect(aave).approve(otcEscrow.address, BNe18(10_000_000));
    await otcEscrow.connect(signer).swap();

    await expect(otcEscrow.swap()).to.be.revertedWith("SwapAlreadyOccured()");
  });
});
