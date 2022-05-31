# Balancer<>Aave Token Swap

This project consists of:

- The `OtcEscrow` contract from Fei
- Tests that demonstate how the escrow contract will be used on mainnet to execute the swap
- A deployment script

## Quick start

Run the following commands:

```shell
yarn && yarn build && yarn test
```

## Deployment

You'll need to know the exact amount of tokens each party should receive; also note that each party's address must be the recipient of the funds, as well as the one to execute any interactions with the escrow contract.

Deploy script inputs:

- `balancer`: the address of Balancer's DAO treasury/executor contract
- `aave`: the address of Aave's DAO treasury/executor contract
- `balToken`: the address of the BAL token contract
- `aaveToken`: the address of the AAVE token contract
- `balAmount`: the amount of BAL token sent in this swap
- `aaveAmount`: the amount of AAVE token sent in this swap

To deploy to mainnet:

```shell
yarn deploy --bal-amount <BAL amount> --aave-amount <AAVE amount>
```

To deploy to a testnet:

```shell
yarn deploy --balancer <Balancer DAO address> --aave <Aave DAO address> --bal-token <BAL token contract address> --aave-token <AAVE token contract address> --bal-amount <BAL amount> --aave-amount <AAVE amount>
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Rinkeby.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your INFURA project ID, and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
npx hardhat deploy --network rinkeby
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command, followed by the constructor parameters you used to deploy the contract:

```shell
npx hardhat verify --network rinkeby DEPLOYED_CONTRACT_ADDRESS <paste constructor arguments here>
```

## Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
