import { task, types } from "hardhat/config";
import promptjs from "prompt";
import { BigNumber, ContractFactory, utils } from "ethers";
import type { ethers as ethersType } from "ethers";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";

promptjs.colors = false;
promptjs.message = "> ";
promptjs.delimiter = "";

const BAL_DAO_ON_MAINNET = "0xb618f903ad1d00d6f7b92f5b0954dcdc056fc533";
const COW_DAO_ON_MAINNET = "0xcA771eda0c70aA7d053aB1B25004559B918FE662";
const BAL_TOKEN_ON_MAINNET = "0xba100000625a3754423978a60c9317c58a424e3d";
const COW_TOKEN_ON_MAINNET = "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB";

task("deploy", "Deploys OtcEscrowApprovals")
  .addParam("balancer", "Address of Balancer DAO", BAL_DAO_ON_MAINNET, types.string)
  .addParam("cow", "Address of Cow DAO", COW_DAO_ON_MAINNET, types.string)
  .addParam("balToken", "Address of the BAL token contract", BAL_TOKEN_ON_MAINNET, types.string)
  .addParam("cowToken", "Address of the COW token contract", COW_TOKEN_ON_MAINNET, types.string)
  .addParam("balAmount", "Amount of BAL token to swap", undefined, types.int)
  .addParam("cowAmount", "Amount of COW token to swap", undefined, types.int)
  .setAction(
    async ({ balancerDAO, cowDAO, balToken, cowToken, balAmount, cowAmount }, { ethers }) => {
      const network = await ethers.provider.getNetwork();
      if (network.chainId === 1) {
        if (balancerDAO.toLowerCase() !== BAL_DAO_ON_MAINNET) {
          console.log("Balancer DAO address mismatch, exiting..");
          return;
        }
        if (cowDAO.toLowerCase() !== COW_DAO_ON_MAINNET) {
          console.log("COW DAO address mismatch, exiting..");
          return;
        }
        if (balToken.toLowerCase() !== BAL_TOKEN_ON_MAINNET) {
          console.log("BAL token address mismatch, exiting..");
          return;
        }
        if (cowToken.toLowerCase() !== COW_TOKEN_ON_MAINNET) {
          console.log("COW token address mismatch, exiting..");
          return;
        }
      }

      const factory = await ethers.getContractFactory("OtcEscrowApprovals");

      const gasPrice = await getGasPriceWithPrompt(ethers);
      await printEstimatedCost(factory, gasPrice, [
        balancerDAO,
        cowDAO,
        balToken,
        cowToken,
        balAmount,
        cowAmount,
      ]);

      const deployConfirmed = await getDeploymentConfirmationWithPrompt();
      if (!deployConfirmed) {
        console.log("Exiting");
        return;
      }

      console.log("Deploying...");
      const contract = await factory.deploy(
        balancerDAO,
        cowDAO,
        balToken,
        cowToken,
        balAmount,
        cowAmount,
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
