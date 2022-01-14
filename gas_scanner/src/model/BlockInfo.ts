
export const CURRENT_BLOCK_INFO_VERSION = 2;

//keep names short to improve performance on MongoDB
export class BlockInfo {
    blockNo = 0;
    minGas = 0;
    gasUsed = 0;
    gasLimit = 0;
    transCount = 0;
    blockTime = "";
    blockVer = CURRENT_BLOCK_INFO_VERSION;
}
