# Balancer<>Cow Token Swap

This project consists of:

- The `OtcEscrow` contract from Fei
- Tests that demonstate how the escrow contract will be used on mainnet to execute the swap
- A deployment script

## Deployment

```
npx hardhat deploy --network ethereum
> Enter a gas price (gwei) (9) 10
Estimated cost to deploy OtcEscrowApprovals: 0.00385075 ETH
> Type "DEPLOY" to confirm: DEPLOY
Deploying...
Transaction hash: 0x0592fff9eaee2527497b1b953d98048c3b9f26122ea587aca19e2782a5258471

OtcEscrowApprovals deployed to 0xdBe554ee86FEb0b1c0ac4743503D46cbDF0e8B54
```

```
npx hardhat verify --network ethereum --constructor-args tasks/arguments.js 0xdBe554ee86FEb0b1c0ac4743503D46cbDF0e8B54
Successfully submitted source code for contract
contracts/OtcEscrowApprovals.sol:OtcEscrowApprovals at 0x92ac4304DfA30c168D81324567c04917a5cbBf84
for verification on the block explorer. Waiting for verification result...

Successfully verified contract OtcEscrowApprovals on the block explorer.
https://etherscan.io/address/0xdBe554ee86FEb0b1c0ac4743503D46cbDF0e8B54#code
```

## Quick start

Run the following commands:

```shell
yarn && yarn build && yarn test
```

## Deployment

You'll need to know the exact amount of tokens each party should receive; also note that each party's address must be the recipient of the funds, as well as the one to execute any interactions with the escrow contract.

Deploy script inputs:

- `balancer`: the address of Balancer's DAO treasury/executor contract
- `cow`: the address of Cow's DAO treasury/executor contract
- `balToken`: the address of the BAL token contract
- `cowToken`: the address of the COW token contract
- `balAmount`: the amount of BAL token sent in this swap
- `cowAmount`: the amount of COW token sent in this swap

To deploy to mainnet:

```shell
npx hardhat deploy --network ethereum
```

To deploy to a testnet:

```shell
npx hardhat deploy --network sepolia
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Sepolia.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your INFURA project ID, and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
npx hardhat deploy --network sepolia
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command, after setting the constructor arguments in `tasks/arguments.js`:

```shell
npx hardhat verify --network sepolia --constructor-args tasks/arguments.js DEPLOYED_CONTRACT_ADDRESS
```

## Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
