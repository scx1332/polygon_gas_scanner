import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { bignumberToGwei, delay } from "./utils";
import * as ethers from "ethers";
import * as mongoDB from "mongodb";
import { BlockList } from "net";
import { addBlockEntry, getLastBlockEntry, updateHistEntry, updateTimeFrameEntry } from "./mongo_connector";

const CURRENT_BLOCK_INFO_VERSION = 2;

class ChainGasScannerStatus {
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

export class TimeFrameStatistics {
    name = "";
    blockCount = 0;
    minGas = 0;
    maxMinGas = 0;
    gasUsed = 0;
    gasLimit = 0;
    transCount = 0;
    firstBlockTime = "";
    lastBlockTime = "";
}

export class MinGasBlocksHistogram {
    name = "";
    blockNums = Array<number>();
    minGas = Array<number>();
    blockFill = Array<number>();
}


export class ChainGasScanner {
    blockMap = new Map<number, BlockInfo>();
    gasPricesMap = new Map<number, Array<number>>();

    blockProvider: ethers.providers.JsonRpcBatchProvider;
    transactionsProvider: ethers.providers.JsonRpcBatchProvider;

    chainScannerStatus = new ChainGasScannerStatus();

    transactionReceiptsBatch = new Array<Promise<TransactionReceipt>>();

    workerProcessTransactions: Promise<void> | undefined = undefined;
    workerGetBlocks: Promise<void> | undefined = undefined;

    startingBlockNumber: number = 0;
    blockNumber: number = 0;
    blockTime: string = "";

    constructor(providerRpcAddress: string, startingBlock: number) {
        this.blockProvider = new ethers.providers.JsonRpcBatchProvider(providerRpcAddress);
        this.transactionsProvider = new ethers.providers.JsonRpcBatchProvider(providerRpcAddress);
        this.startingBlockNumber = startingBlock;
    }

    computeBlockHistogram(name: string, blockCount: number): MinGasBlocksHistogram {
        let mgh = new MinGasBlocksHistogram();
        mgh.name = name;
        for (let blockNo = this.blockNumber - blockCount; blockNo < this.blockNumber; blockNo += 1) {
            let bi = this.blockMap.get(blockNo);
            if (bi !== undefined) {
                mgh.blockNums.push(bi.blockNo);
                mgh.minGas.push(bi.minGas);
                mgh.blockFill.push(bi.gasUsed / bi.gasLimit);
            }
        }
        return mgh;
    }

    computeTimeFrameStatistics(name: string, blockCount: number): TimeFrameStatistics {
        let tfs = new TimeFrameStatistics();
        tfs.name = name;
        for (let blockNo = this.blockNumber - blockCount; blockNo < this.blockNumber; blockNo += 1) {
            let bi = this.blockMap.get(blockNo);

            if (bi !== undefined) {
                if (tfs.firstBlockTime == "") {
                    tfs.firstBlockTime = bi.blockTime;
                }
                tfs.lastBlockTime = bi.blockTime;
                tfs.blockCount += 1;
                if (bi.transCount != 0) {
                    tfs.transCount += bi.transCount;
                    if (tfs.minGas == 0.0) {
                        tfs.minGas = bi.minGas;
                    }
                    if (bi.minGas < tfs.minGas) {
                        tfs.minGas = bi.minGas;
                    }
                    if (bi.minGas > tfs.maxMinGas) {
                        tfs.maxMinGas = bi.minGas;
                    }
                }
            }
        }
        return tfs;
    }

    async getBlocksWorker() {
        try {
            this.blockNumber = this.startingBlockNumber;

            if (this.blockNumber <= 0) {
                this.blockNumber = await this.blockProvider.getBlockNumber();
            }

            while (true) {
                for (let blockNum of this.gasPricesMap.keys()) {
                    if (blockNum < this.blockNumber - 10) {
                        this.gasPricesMap.delete(blockNum);
                    }
                }
                for (let blockNum of this.blockMap.keys()) {
                    if (blockNum < this.blockNumber - 1200) {
                        this.blockMap.delete(blockNum);
                    }
                }

                let blockPromise = this.blockProvider.getBlock(this.blockNumber);
                let blockNumberPromise = this.blockProvider.getBlockNumber();

                let block = await blockPromise;
                let blockNumberFromNetwork = await blockNumberPromise;

                if (blockNumberFromNetwork > this.blockNumber) {
                    console.warn(`Scanner is late ${blockNumberFromNetwork - this.blockNumber} blocks`);
                }
                this.chainScannerStatus.currentBlock = blockNumberFromNetwork;
                this.chainScannerStatus.processedBlock = this.blockNumber;
                this.chainScannerStatus.lateBlocks = blockNumberFromNetwork - this.blockNumber;
                if (this.chainScannerStatus.lateBlocks > this.chainScannerStatus.maxLateBlocks) {
                    this.chainScannerStatus.maxLateBlocks = this.chainScannerStatus.lateBlocks;
                }
                this.chainScannerStatus.lastUpdate = new Date().toISOString();
                if (block == null) {
                    //console.log("Too fast, no block info yet");
                    await delay(300);
                    continue;
                }

                //console.log(block);
                this.blockTime = new Date(block.timestamp * 1000).toISOString();
                this.blockNumber = block.number;

                let blockInfo = this.blockMap.get(this.blockNumber);
                if (blockInfo === undefined) {
                    blockInfo = new BlockInfo();
                    blockInfo.gasLimit = block.gasLimit.toNumber();
                    blockInfo.transCount = block.transactions.length;
                    blockInfo.blockTime = new Date(block.timestamp * 1000).toISOString();
                    this.blockMap.set(this.blockNumber, blockInfo);
                }

                let nextBatch = new Array<Promise<TransactionReceipt>>();
                for (let transaction of block.transactions) {
                    //this.transactionsToProcess.push(transaction);
                    nextBatch.push(this.transactionsProvider.getTransactionReceipt(transaction));
                }
                //good moment to store data in db;

                const query = { name: this.chainScannerStatus.name };
                const update = { $set: this.chainScannerStatus };
                const options = { upsert: true };

                //await this.mongoDBCollection.updateOne(query, update, options);

                //wait until previous batch gets processed
                while (this.transactionReceiptsBatch.length > 0) {
                    await delay(50);
                }

                {
                    let bi = this.blockMap.get(this.blockNumber - 1);
                    if (bi !== undefined) {
                        console.log(`Block no ${bi.blockNo}, minimum gas: ${bi.minGas}, gas used: ${bi.gasUsed}, gas limit: ${bi.gasLimit}, transaction count: ${bi.transCount}`);
                        await addBlockEntry(bi);
                    }
                }

                let mgh10 = this.computeBlockHistogram("hist_10_block", 10);
                await updateHistEntry(mgh10);

                let tfs10 = this.computeTimeFrameStatistics("last_10_block", 10);
                await updateTimeFrameEntry(tfs10);

                let tfs100 = this.computeTimeFrameStatistics("last_100_block", 100);
                await updateTimeFrameEntry(tfs100);

                let tfs1000 = this.computeTimeFrameStatistics("last_1000_block", 1000);
                await updateTimeFrameEntry(tfs1000);

                this.chainScannerStatus.totalTransactionCount += nextBatch.length;
                this.transactionReceiptsBatch = nextBatch;

                this.blockNumber += 1;
            }
        }
        catch (ex) {
            await delay(1000);
            console.error(ex);
        }
    }

    processTransactionReceipt(transactionReceipt: TransactionReceipt) {
        let transferCount = 0;
        let addresses: { [address: string]: number } = {};
        //console.log("Gas price: " + transactionReceipt.effectiveGasPrice);

        let blockNumber = transactionReceipt.blockNumber;

        let blockInfo = this.blockMap.get(blockNumber);
        if (blockInfo === undefined) {
            blockInfo = new BlockInfo();
            this.blockMap.set(blockNumber, blockInfo);
        }
        let gasPricesArray = this.gasPricesMap.get(blockNumber);
        if (gasPricesArray === undefined) {
            gasPricesArray = new Array<number>();
            this.gasPricesMap.set(blockNumber, gasPricesArray);
        }

        let effectiveGasPrice = bignumberToGwei(transactionReceipt.effectiveGasPrice);
        //if gas price is lower than 1 gwei then it is special transaction (propably with zero gas)
        if (effectiveGasPrice >= 1.0) {
            gasPricesArray.push(effectiveGasPrice);
            if (blockInfo.minGas == 0.0) {
                blockInfo.minGas = effectiveGasPrice;
            }
            blockInfo.minGas = Math.min(blockInfo.minGas, bignumberToGwei(transactionReceipt.effectiveGasPrice));
        }
        blockInfo.blockNo = transactionReceipt.blockNumber;
        blockInfo.gasUsed += transactionReceipt.gasUsed.toNumber();

        /*for (let log of transactionReceipt.logs) {
            try {
                console.log(`Log parsed`)
            } catch (e) {
                //ignore
                //console.log(e);
            }
        }*/
        if (transferCount >= 2 && transferCount <= 3) {
            for (let address in addresses) {
                //console.log(address);
            }
        }
    }

    async processTransactions() {
        while (true) {
            try {
                if (this.transactionReceiptsBatch.length > 0) {
                    for (let promise of this.transactionReceiptsBatch) {

                        let transactionReceipt = await promise;
                        if (transactionReceipt == null) {
                            //console.error("Cannot get transaction receipt + " + transaction);
                            continue;
                        }
                        this.processTransactionReceipt(transactionReceipt);
                        this.chainScannerStatus.processedTransactionCount += 1;
                    }
                    let droppedTransactions = this.chainScannerStatus.totalTransactionCount - this.chainScannerStatus.processedTransactionCount;
                    this.chainScannerStatus.droppedTransactionCount = droppedTransactions;
                    console.log(`Processed vs total transaction count ${this.chainScannerStatus.processedTransactionCount}/${this.chainScannerStatus.totalTransactionCount}). Dropped count: ${droppedTransactions}`)
                    this.transactionReceiptsBatch.length = 0;
                }


                await delay(100);
                continue;
            }
            catch (e) {
                this.transactionReceiptsBatch.length = 0;
                console.error("Something went wrong, dropping transaction batch + " + e);
                await delay(100);
            }
        }
    }

    async runWorkers() {
        this.workerProcessTransactions = this.processTransactions();
        this.workerGetBlocks = this.getBlocksWorker();
    }

}





