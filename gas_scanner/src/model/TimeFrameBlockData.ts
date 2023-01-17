export const CURRENT_TIME_FRAME_BLOCK_VERSION = 3;

export class TimeFrameBlockData {
    blockCount = 0;
    minGas = 0;
    maxMinGas = 0;
    gasUsed = 0;
    gasLimit = 0;
    transCount = 0;
    timeFrameStart = "";
    timeSpanSeconds = 0;
    firstBlock = 0;
    lastBlock = 0;
    totalFees = 0;
    burnedFees = 0;
    totalMinGas = 0;
    minBaseFee = 0;
    minPriorityFee = 0;
    version = CURRENT_TIME_FRAME_BLOCK_VERSION;
}
