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
  let cow: SignerWithAddress;
  let balToken: TestERC20;
  let cowToken: TestERC20;
  let balAmountWad: BigNumber;
  let cowAmountWad: BigNumber;
  let otcEscrow: OtcEscrowApprovals;

  before(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    balancer = signers[1];
    cow = signers[2];
    balAmountWad = BNe18(1_000_000);
    cowAmountWad = BNe18(1_000_000);

    const tokenFactory = new TestERC20__factory(signer);
    balToken = await tokenFactory.deploy("Balancer Token", "BAL");
    cowToken = await tokenFactory.deploy("Cow Token", "COW");

    balToken.mint(balancer.address, balAmountWad);
    cowToken.mint(cow.address, cowAmountWad);

    otcEscrow = await new OtcEscrowApprovals__factory(signer).deploy(
      balancer.address,
      cow.address,
      balToken.address,
      cowToken.address,
      balAmountWad,
      cowAmountWad
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
    await cowToken.connect(cow).approve(otcEscrow.address, cowAmountWad);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap fails when cow never approves", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap fails when balancer revokes approval", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
    await cowToken.connect(cow).approve(otcEscrow.address, cowAmountWad);

    await balToken.connect(balancer).approve(otcEscrow.address, 0);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap fails when cow revokes approval", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
    await cowToken.connect(cow).approve(otcEscrow.address, cowAmountWad);

    await cowToken.connect(cow).approve(otcEscrow.address, 0);

    await expect(otcEscrow.swap()).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("swap works and emits given sufficient approvals", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, balAmountWad);
    await cowToken.connect(cow).approve(otcEscrow.address, cowAmountWad);

    await expect(otcEscrow.swap()).to.emit(otcEscrow, "Swap").withArgs(balAmountWad, cowAmountWad);
  });

  it("swap fails when tried to execute for more than one time", async () => {
    await balToken.connect(balancer).approve(otcEscrow.address, BNe18(10_000_000));
    await cowToken.connect(cow).approve(otcEscrow.address, BNe18(10_000_000));
    await otcEscrow.connect(signer).swap();

    await expect(otcEscrow.swap()).to.be.revertedWith("SwapAlreadyOccured()");
  });
});
