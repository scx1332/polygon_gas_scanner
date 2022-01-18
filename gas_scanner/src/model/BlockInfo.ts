
export const CURRENT_BLOCK_INFO_VERSION = 2;

//keep names short to improve performance on MongoDB
export class BlockInfo {
    blockNo = 0;
    minGas = 0;
    baseFeePrice = 0;
    gasUsed = 0;
    gasLimit = 0;
    transCount = 0;
    transCount2 = 0;
    gasUsed2 = 0;
    blockTime = "";
    burnedFees = 0;
    totalFees = 0;
    blockVer = CURRENT_BLOCK_INFO_VERSION;
}
