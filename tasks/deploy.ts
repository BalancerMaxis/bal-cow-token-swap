import { task, types } from "hardhat/config";
import promptjs from "prompt";
import { BigNumber, ContractFactory, utils } from "ethers";
import type { ethers as ethersType } from "ethers";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";

promptjs.colors = false;
promptjs.message = "> ";
promptjs.delimiter = "";

const BAL_DAO_ON_MAINNET = "0xb618f903ad1d00d6f7b92f5b0954dcdc056fc533";
const AAVE_DAO_ON_MAINNET = "0xec568fffba86c094cf06b22134b23074dfe2252c";
const BAL_TOKEN_ON_MAINNET = "0xba100000625a3754423978a60c9317c58a424e3d";
const AAVE_TOKEN_ON_MAINNET = "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9";

task("deploy", "Deploys OtcEscrowApprovals")
  .addParam("balancerDAO", "Address of Balancer DAO", BAL_DAO_ON_MAINNET, types.string)
  .addParam("aaveDAO", "Address of Aave DAO", AAVE_DAO_ON_MAINNET, types.string)
  .addParam("balToken", "Address of the BAL token contract", BAL_TOKEN_ON_MAINNET, types.string)
  .addParam("aaveToken", "Address of the AAVE token contract", AAVE_TOKEN_ON_MAINNET, types.string)
  .addParam("balAmount", "Amount of BAL token to swap", undefined, types.int)
  .addParam("aaveAmount", "Amount of AAVE token to swap", undefined, types.int)
  .setAction(
    async ({ balancerDAO, aaveDAO, balToken, aaveToken, balAmount, aaveAmount }, { ethers }) => {
      const network = await ethers.provider.getNetwork();
      if (network.chainId === 1) {
        if (balancerDAO.toLowerCase() !== BAL_DAO_ON_MAINNET) {
          console.log("Balancer DAO address mismatch, exiting..");
          return;
        }
        if (aaveDAO.toLowerCase() !== AAVE_DAO_ON_MAINNET) {
          console.log("AAVE DAO address mismatch, exiting..");
          return;
        }
        if (balToken.toLowerCase() !== BAL_TOKEN_ON_MAINNET) {
          console.log("BAL token address mismatch, exiting..");
          return;
        }
        if (aaveToken.toLowerCase() !== AAVE_TOKEN_ON_MAINNET) {
          console.log("AAVE token address mismatch, exiting..");
          return;
        }
      }

      network.chainId === 1
        ? "0xa5409ec958c83c3f309868babaca7c86dcb077c1"
        : "0xf57b2c51ded3a29e6891aba85459d600256cf317";

      const factory = await ethers.getContractFactory("OtcEscrowApprovals");

      const gasPrice = await getGasPriceWithPrompt(ethers);
      await printEstimatedCost(factory, gasPrice, [
        balancerDAO,
        aaveDAO,
        balToken,
        aaveToken,
        balAmount,
        aaveAmount,
      ]);

      const deployConfirmed = await getDeploymentConfirmationWithPrompt();
      if (!deployConfirmed) {
        console.log("Exiting");
        return;
      }

      console.log("Deploying...");
      const contract = await factory.deploy(
        balancerDAO,
        aaveDAO,
        balToken,
        aaveToken,
        balAmount,
        aaveAmount,
        { gasPrice }
      );
      console.log(`Transaction hash: ${contract.deployTransaction.hash} \n`);
      console.log(`OtcEscrowApprovals deployed to ${contract.address}`);
    }
  );

export async function getGasPriceWithPrompt(
  ethers: typeof ethersType & HardhatEthersHelpers
): Promise<BigNumber> {
  const gasPrice = await ethers.provider.getGasPrice();
  const gasInGwei = Math.round(Number(ethers.utils.formatUnits(gasPrice, "gwei")));

  promptjs.start();

  let result = await promptjs.get([
    {
      properties: {
        gasPrice: {
          type: "integer",
          required: true,
          description: "Enter a gas price (gwei)",
          default: gasInGwei,
        },
      },
    },
  ]);

  return ethers.utils.parseUnits(result.gasPrice.toString(), "gwei");
}

export async function printEstimatedCost(
  factory: ContractFactory,
  gasPrice: BigNumber,
  args: any[]
) {
  const deploymentGas = await factory.signer.estimateGas(
    factory.getDeployTransaction(...args, { gasPrice })
  );
  const deploymentCost = deploymentGas.mul(gasPrice);
  console.log(
    `Estimated cost to deploy OtcEscrowApprovals: ${utils.formatUnits(deploymentCost, "ether")} ETH`
  );
}

export async function getDeploymentConfirmationWithPrompt(): Promise<boolean> {
  const result = await promptjs.get([
    {
      properties: {
        confirm: {
          type: "string",
          description: 'Type "DEPLOY" to confirm:',
        },
      },
    },
  ]);

  return result.confirm == "DEPLOY";
}
