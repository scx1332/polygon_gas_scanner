/***
 * Converts big number value (as on Ethereum chain) to user and bot friendly float value of currency.
 * @param amount - Amount in big number
 * @param decimals - Has to be integer between 0 and 18 which informs how many decimals currency has
 */
import { BigNumber } from "ethers";


export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function bignumberToGwei(bn: BigNumber) {
    const GIGA = 1000000000;
    return bn.div(GIGA).toNumber() + bn.mod(GIGA).toNumber() / GIGA;
}