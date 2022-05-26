import { BigNumber, BigNumberish } from "ethers";

export const BN = BigNumber.from;
export const BNe = (n: BigNumberish, exponent: BigNumberish) => BN(n).mul(BN(10).pow(exponent));
export const BNe18 = (n: BigNumberish) => BNe(n, 18);
export const BNeUndo = (bn: BigNumber, exp: BigNumberish) => bn.div(BN(10).pow(exp));
export const BNe18Undo = (bn: BigNumber) => BNeUndo(bn, 18);
