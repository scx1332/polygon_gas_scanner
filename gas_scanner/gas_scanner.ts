import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {bignumberToGwei, delay} from "./utils";
import * as ethers from "ethers";
import * as mongoDB from "mongodb";
import {BlockList} from "net";
import {addBlockEntry, updateTimeFrameEntry} from "./mongo_connector";


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

export class BlockStatistics {
    blockNo = 0;
    minimumGasInBlock = 0;
    gasUsed = 0;
    gasLimit = 0;
    transactionCount = 0;
    blockTime = "";
}

export class TimeFrameStatistics {
    name = "";
    blockCount = 0;
    minimumGasInBlock = 0;
    gasUsed = 0;
    gasLimit = 0;
    transactionCount = 0;
    firstBlockTime = "";
    lastBlockTime = "";
}

export class ChainGasScanner {
    blockMap = new Map<number, BlockStatistics>();

    blockProvider : ethers.providers.JsonRpcBatchProvider;
    transactionsProvider : ethers.providers.JsonRpcBatchProvider;
    fillMissingBlocks: boolean;

    chainScannerStatus = new ChainGasScannerStatus();

    transactionReceiptsBatch = new Array<Promise<TransactionReceipt>>();

    workers : Array<Promise<void>> = [];
    getBlockWorker : Promise<void> | undefined = undefined;


    blockNumber : number = 0;
    blockTime : string = "";


    constructor(providerRpcAddress : string, fillMissingBlocks : boolean) {
        this.blockProvider = new ethers.providers.JsonRpcBatchProvider(providerRpcAddress);
        this.transactionsProvider = new ethers.providers.JsonRpcBatchProvider(providerRpcAddress);
        this.fillMissingBlocks = fillMissingBlocks;
    }

    async getBlock() {
        try {
            if (this.fillMissingBlocks) {

            } else {
                let blockNumber = await this.blockProvider.getBlockNumber();
            }
            while (true) {

                let blockPromise = this.blockProvider.getBlock(blockNumber);
                let blockNumberPromise = this.blockProvider.getBlockNumber();

                let block = await blockPromise;
                let blockNumberFromNetwork = await blockNumberPromise;

                if (blockNumberFromNetwork > blockNumber) {
                    console.warn(`Scanner is late ${blockNumberFromNetwork - blockNumber} blocks`);
                }
                this.chainScannerStatus.currentBlock = blockNumberFromNetwork;
                this.chainScannerStatus.processedBlock = blockNumber;
                this.chainScannerStatus.lateBlocks = blockNumberFromNetwork - blockNumber;
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

                let blockInfo = this.blockMap.get(blockNumber);
                if (blockInfo === undefined) {
                    blockInfo = new BlockStatistics();
                    blockInfo.gasLimit = block.gasLimit.toNumber();
                    blockInfo.transactionCount = block.transactions.length;
                    blockInfo.blockTime = new Date(block.timestamp * 1000).toISOString();
                    this.blockMap.set(blockNumber, blockInfo);
                }

                let nextBatch = new Array<Promise<TransactionReceipt>>();
                for (let transaction of block.transactions) {
                    //this.transactionsToProcess.push(transaction);
                    nextBatch.push(this.transactionsProvider.getTransactionReceipt(transaction));
                }
                //good moment to store data in db;

                const query = {name: this.chainScannerStatus.name};
                const update = {$set: this.chainScannerStatus};
                const options = {upsert: true};

                //await this.mongoDBCollection.updateOne(query, update, options);

                //wait until previous batch gets processed
                while (this.transactionReceiptsBatch.length > 0) {
                    await delay(50);
                }

                {
                    let bi = this.blockMap.get(blockNumber - 1);
                    if (bi !== undefined) {
                        console.log(`Block no ${bi.blockNo}, minimum gas: ${bi.minimumGasInBlock}, gas used: ${bi.gasUsed}, gas limit: ${bi.gasLimit}, transaction count: ${bi.transactionCount}`);
                        await addBlockEntry(bi);
                    }
                }


                let tfs = new TimeFrameStatistics();
                tfs.name = "last_10_block";
                for (let blockNo = blockNumber - 10; blockNo < blockNumber; blockNo += 1) {
                    let bi = this.blockMap.get(blockNo);


                    if (bi !== undefined) {
                        if (tfs.firstBlockTime == "") {
                            tfs.firstBlockTime = bi.blockTime;
                        }
                        tfs.lastBlockTime = bi.blockTime;
                        tfs.blockCount += 1;
                        if (bi.transactionCount != 0) {
                            tfs.transactionCount += bi.transactionCount;
                            if (tfs.minimumGasInBlock == 0.0) {
                                tfs.minimumGasInBlock = bi.minimumGasInBlock;
                            }
                            if (bi.minimumGasInBlock < tfs.minimumGasInBlock) {
                                tfs.minimumGasInBlock = bi.minimumGasInBlock;
                            }
                        }
                    }
                }
                await updateTimeFrameEntry(tfs);


                this.chainScannerStatus.totalTransactionCount += nextBatch.length;
                this.transactionReceiptsBatch = nextBatch;

                blockNumber += 1;
            }
        }
        catch (ex)
        {
            await delay(1000);
            console.error(ex);
        }
    }

    processTransactionReceipt(transactionReceipt : TransactionReceipt) {
        let transferCount = 0;
        let addresses : { [address: string] : number } = {};
        //console.log("Gas price: " + transactionReceipt.effectiveGasPrice);

        let blockNumber = transactionReceipt.blockNumber;

        let blockInfo = this.blockMap.get(blockNumber);
        if (blockInfo === undefined) {
            blockInfo = new BlockStatistics();
            this.blockMap.set(blockNumber, blockInfo);
        }
        if (blockInfo.minimumGasInBlock == 0.0) {
            blockInfo.minimumGasInBlock = bignumberToGwei(transactionReceipt.effectiveGasPrice);
        }
        blockInfo.minimumGasInBlock = Math.min(blockInfo.minimumGasInBlock, bignumberToGwei(transactionReceipt.effectiveGasPrice));
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
        for (let i = 0; i < 1; i++) {
            this.workers.push(this.processTransactions());
        }
        this.getBlockWorker = this.getBlock();
    }

}





