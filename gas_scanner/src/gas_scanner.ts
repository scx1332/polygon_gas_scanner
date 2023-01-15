import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { bignumberToGwei, delay } from "../utils";
import * as ethers from "ethers";
import IERC20_abi from "./contracts/IERC20.abi.json";
import {
    addBlockEntry,
    addERC20TransactionEntry,
    addMonitoredAddress,
    getMonitoredAddresses,
    updateHistEntry,
    updateTimeFrameEntry,
} from "./mongo_connector";
import { BlockInfo } from "./model/BlockInfo";
import { ChainGasScannerStatus } from "./model/ChainGasScannerStatus";
import { TimeFrameStatistics } from "./model/TimeFrameStatistics";
import { MinGasBlocksHistogram } from "./model/MinGasBlocksHistogram";
import { TransactionERC20Entry } from "./model/TransactionEntry";
import { MonitoredAddress } from "./model/MonitoredAddresses";

const ERC20interface = new ethers.utils.Interface(IERC20_abi);

export class ChainGasScanner {
    blockMap = new Map<number, BlockInfo>();
    transReceiptMap = new Map<number, Array<TransactionReceipt>>();

    blockProvider: ethers.providers.JsonRpcBatchProvider;
    transactionsProvider: ethers.providers.JsonRpcBatchProvider;

    chainScannerStatus = new ChainGasScannerStatus();

    transactionReceiptsBatch = new Array<Promise<TransactionReceipt>>();

    workerProcessTransactions: Promise<void> | undefined = undefined;
    workerGetBlocks: Promise<void> | undefined = undefined;

    startingBlockNumber = 0;
    blockNumber = 0;
    blockTime = "";

    monitoredAddresses = new Map<string, MonitoredAddress>();

    constructor(providerRpcAddress: string, startingBlock: number) {
        this.blockProvider = new ethers.providers.JsonRpcBatchProvider(providerRpcAddress);
        this.transactionsProvider = new ethers.providers.JsonRpcBatchProvider(providerRpcAddress);
        this.startingBlockNumber = startingBlock;
    }

    async loadMonitoredAddresses() {
        const list = await getMonitoredAddresses();
        for (const addr of list) {
            this.monitoredAddresses.set(addr.address.toLowerCase(), addr);
        }
    }

    computeBlockHistogram(name: string, blockCount: number): MinGasBlocksHistogram {
        const mgh = new MinGasBlocksHistogram();
        mgh.name = name;
        for (let blockNo = this.blockNumber - blockCount; blockNo < this.blockNumber; blockNo += 1) {
            const bi = this.blockMap.get(blockNo);
            if (bi !== undefined) {
                mgh.blockNums.push(bi.blockNo);
                mgh.minGas.push(bi.minGas);
                mgh.blockFill.push(bi.gasUsed / bi.gasLimit);
            }
        }
        return mgh;
    }

    computeTimeFrameStatistics(name: string, blockCount: number): TimeFrameStatistics {
        const tfs = new TimeFrameStatistics();
        tfs.name = name;
        for (let blockNo = this.blockNumber - blockCount; blockNo < this.blockNumber; blockNo += 1) {
            const bi = this.blockMap.get(blockNo);

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

            for (;;) {
                for (const blockNum of this.transReceiptMap.keys()) {
                    if (blockNum < this.blockNumber - 10) {
                        this.transReceiptMap.delete(blockNum);
                    }
                }
                for (const blockNum of this.blockMap.keys()) {
                    if (blockNum < this.blockNumber - 1200) {
                        this.blockMap.delete(blockNum);
                    }
                }

                const blockPromise = this.blockProvider.getBlock(this.blockNumber);
                const blockNumberPromise = this.blockProvider.getBlockNumber();

                const block = await blockPromise;
                const blockNumberFromNetwork = await blockNumberPromise;

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
                    blockInfo.blockNo = this.blockNumber;
                    blockInfo.gasLimit = block.gasLimit.toNumber();
                    blockInfo.transCount = block.transactions.length;
                    blockInfo.blockTime = new Date(block.timestamp * 1000).toISOString();
                    if (block.baseFeePerGas) {
                        blockInfo.baseFeePrice = bignumberToGwei(block.baseFeePerGas);
                    }
                    this.blockMap.set(this.blockNumber, blockInfo);
                }

                const nextBatch = new Array<Promise<TransactionReceipt>>();
                for (const transaction of block.transactions) {
                    //this.transactionsToProcess.push(transaction);
                    nextBatch.push(this.transactionsProvider.getTransactionReceipt(transaction));
                }
                //good moment to store data in db;

                //const query = { name: this.chainScannerStatus.name };
                //const update = { $set: this.chainScannerStatus };
                //const options = { upsert: true };

                //await this.mongoDBCollection.updateOne(query, update, options);

                //wait until previous batch gets processed
                while (this.transactionReceiptsBatch.length > 0) {
                    await delay(50);
                }

                {
                    const gas_prices_array = this.transReceiptMap.get(this.blockNumber - 1);
                    const bi = this.blockMap.get(this.blockNumber - 1);
                    if (bi !== undefined && (gas_prices_array !== undefined || bi.transCount === 0)) {
                        if (gas_prices_array && gas_prices_array.length > 0) {
                            gas_prices_array.sort(
                                (a, b) => bignumberToGwei(a.effectiveGasPrice) - bignumberToGwei(b.effectiveGasPrice),
                            );
                            if (bi.minGas != bignumberToGwei(gas_prices_array[0].effectiveGasPrice)) {
                                console.log("Something went wrong bi.minGas != gas_prices_array[0]");
                            }
                            const firstTransGas = gas_prices_array[0].gasUsed.toNumber();
                            if (firstTransGas < 50000 && gas_prices_array.length > 1) {
                                bi.minGas = bignumberToGwei(gas_prices_array[1].effectiveGasPrice);
                            }
                            bi.medianGas = bignumberToGwei(
                                gas_prices_array[Math.floor(gas_prices_array.length / 2)].effectiveGasPrice,
                            );
                        }
                        console.log(
                            `Block no ${bi.blockNo}, minimum gas: ${bi.minGas}, gas used: ${bi.gasUsed}, gas limit: ${bi.gasLimit}, transaction count: ${bi.transCount}`,
                        );
                        await addBlockEntry(bi);
                    }
                }

                const mgh10 = this.computeBlockHistogram("hist_10_block", 10);
                await updateHistEntry(mgh10);

                const tfs10 = this.computeTimeFrameStatistics("last_10_block", 10);
                await updateTimeFrameEntry(tfs10);

                const tfs100 = this.computeTimeFrameStatistics("last_100_block", 100);
                await updateTimeFrameEntry(tfs100);

                const tfs1000 = this.computeTimeFrameStatistics("last_1000_block", 1000);
                await updateTimeFrameEntry(tfs1000);

                this.chainScannerStatus.totalTransactionCount += nextBatch.length;
                this.transactionReceiptsBatch = nextBatch;

                this.blockNumber += 1;
            }
        } catch (ex) {
            await delay(1000);
            console.error(ex);
        }
    }

    async processTransactionReceipt(transactionReceipt: TransactionReceipt) {
        //const transferCount = 0;
        //const addresses: { [address: string]: number } = {};
        //console.log("Gas price: " + transactionReceipt.effectiveGasPrice);

        const blockNumber = transactionReceipt.blockNumber;

        let blockInfo = this.blockMap.get(blockNumber);
        if (blockInfo === undefined) {
            blockInfo = new BlockInfo();
            this.blockMap.set(blockNumber, blockInfo);
        }
        let gasPricesArray = this.transReceiptMap.get(blockNumber);
        if (gasPricesArray === undefined) {
            gasPricesArray = new Array<TransactionReceipt>();
            this.transReceiptMap.set(blockNumber, gasPricesArray);
        }

        const effectiveGasPrice = bignumberToGwei(transactionReceipt.effectiveGasPrice);
        //if gas price is lower than 1 gwei then it is special transaction (propably with zero gas)
        if (effectiveGasPrice >= 1.0) {
            gasPricesArray.push(transactionReceipt);
            if (blockInfo.minGas == 0.0) {
                blockInfo.minGas = effectiveGasPrice;
            }
            blockInfo.minGas = Math.min(blockInfo.minGas, bignumberToGwei(transactionReceipt.effectiveGasPrice));
        }
        blockInfo.blockNo = transactionReceipt.blockNumber;
        blockInfo.gasUsed += transactionReceipt.gasUsed.toNumber();
        const burnedFees = blockInfo.baseFeePrice * transactionReceipt.gasUsed.toNumber() * 1.0e-9;
        const totalFees =
            bignumberToGwei(transactionReceipt.effectiveGasPrice) * transactionReceipt.gasUsed.toNumber() * 1.0e-9;

        if (transactionReceipt.type == 2) {
            blockInfo.transCount2 += 1;
            blockInfo.gasUsed2 += 1;
        }
        blockInfo.burnedFees += burnedFees;
        blockInfo.totalFees += totalFees;

        /*for (const log of transactionReceipt.logs) {
            try {
                console.log(`Log parsed`)
            } catch (e) {
                //ignore
                //console.log(e);
            }
        }*/

        try {
            if (transactionReceipt.to != undefined && transactionReceipt.from != undefined) {
                if (transactionReceipt.to.toLowerCase() == "0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf") {
                    const transactionInfo = await this.transactionsProvider.getTransaction(
                        transactionReceipt.transactionHash,
                    );
                    for (const log of transactionReceipt.logs) {
                        try {
                            const parsed = ERC20interface.parseLog(log);
                            //console.log(JSON.stringify(parsed));
                            if (parsed.name == "Transfer") {
                                //console.log("Block number: " + blockNumber);
                                //console.log("Tx transaction: " + transactionReceipt.transactionHash);

                                const tokenFrom = parsed.args[0];
                                const tokenTo = parsed.args[1];
                                const amount = parsed.args[2];

                                if (!this.monitoredAddresses.has(transactionReceipt.from.toLowerCase())) {
                                    const ma = new MonitoredAddress();
                                    ma.address = transactionReceipt.from.toString().toLowerCase();
                                    this.monitoredAddresses.set(ma.address.toLowerCase(), ma);
                                    await addMonitoredAddress(ma);
                                }

                                const newEntry = new TransactionERC20Entry();
                                newEntry.txid = transactionReceipt.transactionHash.toString().toLowerCase();
                                newEntry.datetime = blockInfo.blockTime;
                                newEntry.nonce = transactionInfo.nonce;
                                newEntry.blockNo = transactionReceipt.blockNumber;
                                newEntry.gasUsed = transactionReceipt.gasUsed.toString();
                                newEntry.gasPrice = transactionReceipt.effectiveGasPrice.toString();
                                newEntry.gasLimit = transactionInfo.gasLimit.toString();
                                newEntry.erc20amount = amount.toString();
                                newEntry.to = transactionReceipt.to.toString().toLowerCase();
                                newEntry.from = transactionReceipt.from.toString().toLowerCase();
                                newEntry.erc20from = tokenFrom.toString().toLowerCase();
                                newEntry.erc20to = tokenTo.toString().toLowerCase();
                                await addERC20TransactionEntry(newEntry);
                                console.log(`Glm transfer from ${tokenFrom} to ${tokenTo}. Amount ${amount}`);
                            }
                        } catch (ex) {
                            console.log(ex);
                        }
                    }
                } else {
                    if (this.monitoredAddresses.has(transactionReceipt.from.toLowerCase())) {
                        const newEntry = new TransactionERC20Entry();
                        newEntry.txid = transactionReceipt.transactionHash.toString().toLowerCase();
                        newEntry.datetime = blockInfo.blockTime;
                        newEntry.nonce = transactionReceipt.transactionIndex;
                        newEntry.blockNo = transactionReceipt.blockNumber;
                        newEntry.gasUsed = transactionReceipt.gasUsed.toString();
                        newEntry.gasPrice = transactionReceipt.effectiveGasPrice.toString();
                        newEntry.erc20amount = "";
                        newEntry.to = transactionReceipt.to.toString().toLowerCase();
                        newEntry.from = transactionReceipt.from.toString().toLowerCase();
                        newEntry.erc20from = "";
                        newEntry.erc20to = "";
                        await addERC20TransactionEntry(newEntry);
                    }
                }
            }
        } catch (e) {
            //ignore
            console.log(e);
        }

        //if (transferCount >= 2 && transferCount <= 3) {
        //    for (const address in addresses) {
                //console.log(address);
        //    }
        //}
        //if (transferCount >= 2 && transferCount <= 3) {
        //    for (const address in addresses) {
                //console.log(address);
        //    }
        //}
    }

    async processTransactions() {
        for (;;) {
            try {
                if (this.transactionReceiptsBatch.length > 0) {
                    for (const promise of this.transactionReceiptsBatch) {
                        const transactionReceipt = await promise;
                        if (transactionReceipt == null) {
                            //console.error("Cannot get transaction receipt + " + transaction);
                            continue;
                        }
                        await this.processTransactionReceipt(transactionReceipt);
                        this.chainScannerStatus.processedTransactionCount += 1;
                    }
                    const droppedTransactions =
                        this.chainScannerStatus.totalTransactionCount -
                        this.chainScannerStatus.processedTransactionCount;
                    this.chainScannerStatus.droppedTransactionCount = droppedTransactions;
                    console.log(
                        `Processed vs total transaction count ${this.chainScannerStatus.processedTransactionCount}/${this.chainScannerStatus.totalTransactionCount}). Dropped count: ${droppedTransactions}`,
                    );
                    this.transactionReceiptsBatch.length = 0;
                }

                await delay(100);
            } catch (e) {
                this.transactionReceiptsBatch.length = 0;
                console.error("Something went wrong, dropping transaction batch + " + e);
                await delay(100);
            }
        }
    }

    async runWorkers() {
        await this.loadMonitoredAddresses();
        this.workerProcessTransactions = this.processTransactions();
        this.workerGetBlocks = this.getBlocksWorker();
    }
}
