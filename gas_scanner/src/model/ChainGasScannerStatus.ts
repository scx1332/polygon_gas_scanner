export class ChainGasScannerStatus {
    name = "MainScanner_" + new Date().toISOString();
    processedTransactionCount = 0;
    totalTransactionCount = 0;
    droppedTransactionCount = 0;
    processedBlock = 0;
    currentBlock = 0;
    lateBlocks = 0;
    maxLateBlocks = 0;
    lastUpdate = new Date().toISOString();
}
