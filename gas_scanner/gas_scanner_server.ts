import express, { Request } from "express";
import {
    connectToDatabase,
    getBlockEntriesInRange,
    getERC20Transactions,
    getERC20TransactionsFilter,
    getHistEntry,
    getLastBlockEntry,
    getLastBlocks,
    getLastTimeframes,
    getMonitoredAddresses,
    getTimeFrameEntry,
} from "./src/mongo_connector";
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import { bignumberToGwei } from "./utils";
import cors from "cors";

const app = express();
app.use(cors());

dotenv.config();

const PORT = parseInt(process.env.SERVER_LISTEN_PORT ?? "7888");

// Handling GET / Request
app.get("/welcome_test", (req, res) => {
    res.send("Hello!");
});

class GasInfo {
    minGasPrice = "";
    maxMinGasPrice = "";
    optimalGasPrice = "";
    minGasPrice100 = "";
    maxMinGasPrice100 = "";
    minGasPrice1000 = "";
    maxMinGasPrice1000 = "";
    health = "";
    updated = "";
    cached = "";
}
const cacheValidityMs: number = parseInt(process.env.SERVER_CACHE_VALIDITY ?? "2000");

let cachedGasInfo: GasInfo | undefined;
let cachedGasInfoTime: number = 0;
app.get("/polygon/gas-info/current", async (req, res) => {
    try {
        if (Date.now() - cachedGasInfoTime > cacheValidityMs) {
            const tfe = await getTimeFrameEntry("last_10_block");
            const tfe100 = await getTimeFrameEntry("last_100_block");
            const tfe1000 = await getTimeFrameEntry("last_1000_block");
            const gasInfo = new GasInfo();
            gasInfo.cached = new Date(Date.now()).toISOString();
            gasInfo.updated = tfe.lastBlockTime;
            const lastUpdatedMsAgo = Date.now() - Date.parse(tfe.lastBlockTime);
            if (lastUpdatedMsAgo > 60000) {
                gasInfo.health = "Info outdated " + (lastUpdatedMsAgo / 1000.0).toFixed(0) + " seconds";
            } else {
                gasInfo.health = "OK";
            }
            gasInfo.minGasPrice = tfe.minGas.toFixed(2);
            gasInfo.maxMinGasPrice = tfe.maxMinGas.toFixed(2);
            gasInfo.minGasPrice100 = tfe100.minGas.toFixed(2);
            gasInfo.maxMinGasPrice100 = tfe100.maxMinGas.toFixed(2);
            gasInfo.minGasPrice1000 = tfe1000.minGas.toFixed(2);
            gasInfo.maxMinGasPrice1000 = tfe1000.maxMinGas.toFixed(2);
            gasInfo.optimalGasPrice = (tfe.minGas * 1.001).toFixed(2);
            cachedGasInfo = gasInfo;
            cachedGasInfoTime = Date.now();
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(cachedGasInfo));
    } catch (ex) {
        res.sendStatus(404);
    }
});

app.get("/polygon/block-info/last-blocks", async (req, res) => {
    try {
        //@ts-ignore
        const block_count = parseInt(req.query.block_count);

        const blocks = await getLastBlocks(block_count);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(blocks));
    } catch (ex) {
        res.sendStatus(404);
    }
});

app.get("/polygon/block-info/last-time-frames", async (req, res) => {
    try {
        //@ts-ignore
        const block_count = parseInt(req.query.block_count);
        //@ts-ignore
        const timespan_seconds = parseInt(req.query.timespan_seconds);

        const timeframes = await getLastTimeframes(block_count, timespan_seconds);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(timeframes));
    } catch (ex) {
        res.sendStatus(404);
    }
});

//todo: fix all typescript errors
function getIntArg(req: Request, name: string): number {
    let value = req.query[name];
    if (typeof value === "string") {
        return parseInt(value);
    }
    throw new Error("Invalid argument");
}

app.get("/polygon/block-info/list", async (req, res) => {
    try {
        //const num = await getLastBlockEntry();
        //@ts-ignore
        const block_count = parseInt(req.query.block_count);
        //@ts-ignore
        const block_start = parseInt(req.query.block_start);

        const blocks = await getBlockEntriesInRange(block_start, block_start + block_count);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(blocks));
    } catch (ex) {
        res.sendStatus(404);
    }
});

app.get("/polygon/gas-info/waiting_times", async (req, res) => {
    try {
        //@ts-ignore
        const block_count = parseInt(req.query.block_count);
        //@ts-ignore
        const block_start = parseInt(req.query.block_start);

        const blocks = await getBlockEntriesInRange(block_start, block_start + block_count);

        const waiting_times = new Map<string, number>();

        for (let value = 30.0; value < 31.0; value += 0.01) {
            let max_block_wait = -1;
            let wait_time = 0;
            for (const block of blocks) {
                if (block.minGas >= 1.0 && block.minGas <= value) {
                    if (wait_time > max_block_wait) {
                        max_block_wait = wait_time;
                    }
                    wait_time = 0;
                }
                wait_time += 1;
            }
            waiting_times.set(value.toFixed(2), max_block_wait);
        }

        res.setHeader("Content-Type", "application/json");
        //res.end(JSON.stringify(blocks));
        res.end(JSON.stringify({ block_analyzed: blocks.length, waiting_times: Object.fromEntries(waiting_times) }));
    } catch (ex) {
        res.sendStatus(404);
    }
});

app.get("/polygon/gas-info/waiting_times_avg", async (req, res) => {
    try {
        //@ts-ignore
        const block_count = parseInt(req.query.block_count);
        //@ts-ignore
        const block_start = parseInt(req.query.block_start);

        const blocks = await getBlockEntriesInRange(block_start, block_start + block_count);

        const waiting_times = new Map<string, number>();

        for (let value = 30.0; value < 31.0; value += 0.01) {
            let sum_block_wait = 0;
            let sum_block_wait_norm = 0;
            let wait_time = 0;
            for (const block of blocks) {
                if (block.minGas >= 1.0 && block.minGas <= value) {
                    sum_block_wait += (wait_time * wait_time) / 2.0;
                    wait_time = 0;
                }
                wait_time += 1;
                sum_block_wait_norm += 1;
            }
            waiting_times.set(value.toFixed(3), sum_block_wait / sum_block_wait_norm);
        }

        res.setHeader("Content-Type", "application/json");
        //res.end(JSON.stringify(blocks));
        res.end(JSON.stringify({ block_analyzed: blocks.length, waiting_times: Object.fromEntries(waiting_times) }));
    } catch (ex) {
        res.sendStatus(404);
    }
});

app.get("/polygon/gas-info/hist10", async (req, res) => {
    try {
        const he = await getHistEntry("hist_10_block");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(he));
    } catch (ex) {
        res.sendStatus(404);
    }
});

app.get("/polygon/monitored-addresses/all", async (req, res) => {
    try {
        const me = await getMonitoredAddresses();
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(me));
    } catch (ex) {
        res.sendStatus(404);
    }
});

interface ITransactionFilter {
    address?: string;
    min_block?: string;
    max_block?: string;
    min_date?: string;
    max_date?: string;

    aggregate?: string;
}

class SenderSummaryInternal {
    sumErc20Exact: BigNumber = BigNumber.from(0);
    gasPaidExact: BigNumber = BigNumber.from(0);
    transactionCount: number = 0;
    gasUsed: number = 0;
}

class RecipientSummaryInternal {
    sumErc20Exact: BigNumber = BigNumber.from(0);
    gasPaidExact: BigNumber = BigNumber.from(0);
    transactionCount: number = 0;
    gasUsed: number = 0;
}

class SenderSummaryExternal {
    sumErc20Exact: string = "0";
    sumErc20: number = 0;
    gasUsed: number = 0;
    gasPaidExact: string = "0";
    gasPaid: number = 0;
    transactionCount: number = 0;
}
class RecipientSummaryExternal {
    sumErc20Exact: string = "0";
    sumErc20: number = 0;
    gasUsed: number = 0;
    gasPaidExact: string = "0";
    gasPaid: number = 0;
    transactionCount: number = 0;
}

app.get("/polygon/transactions/filter", async (req: Request<{}, {}, {}, ITransactionFilter>, res) => {
    try {
        const filters: any = {};

        if (req.query.address) {
            filters.from = {};
            filters.from.$eq = req.query.address;
        }
        if (req.query.min_block) {
            filters.blockNo = {};
            filters.blockNo.$gte = parseInt(req.query.min_block);
        }
        if (req.query.max_block) {
            if (filters.blockNo === undefined) {
                filters.blockNo = {};
            }
            filters.blockNo.$lte = parseInt(req.query.max_block);
        }
        if (req.query.min_date) {
            filters.datetime = {};
            filters.datetime.$gte = req.query.min_date;
        }
        if (req.query.max_date) {
            if (filters.datetime === undefined) {
                filters.datetime = {};
            }
            filters.datetime.$lte = req.query.max_date;
        }

        const transactions = await getERC20TransactionsFilter(filters);

        const recipients = new Map<string, RecipientSummaryInternal>();
        const senders = new Map<string, SenderSummaryInternal>();

        const recipientsExternal: { [address: string]: RecipientSummaryExternal } = {};
        const sendersExternal: { [address: string]: RecipientSummaryExternal } = {};

        if (req.query.aggregate == "1") {
            let erc20amount = BigNumber.from(0);
            let gasPaid = BigNumber.from(0);

            let erc20transactions = 0;
            let otherTransactions = 0;
            for (const transaction of transactions) {
                let recipient: RecipientSummaryInternal | undefined;
                if (transaction.erc20to) {
                    recipient = recipients.get(transaction.erc20to);
                    if (recipient === undefined) {
                        recipient = new RecipientSummaryInternal();
                        recipients.set(transaction.erc20to, recipient);
                    }
                }
                let sender: SenderSummaryInternal | undefined;
                if (transaction.erc20from) {
                    sender = senders.get(transaction.erc20from);
                    if (sender === undefined) {
                        sender = new SenderSummaryInternal();
                        senders.set(transaction.erc20from, sender);
                    }
                }

                if (transaction.erc20amount) {
                    const amountBig = BigNumber.from(transaction.erc20amount);
                    erc20amount = erc20amount.add(amountBig);

                    if (recipient) {
                        recipient.sumErc20Exact = recipient.sumErc20Exact.add(amountBig);
                        recipient.transactionCount += 1;
                    }
                    if (sender) {
                        sender.sumErc20Exact = sender.sumErc20Exact.add(amountBig);
                        sender.transactionCount += 1;
                    }

                    erc20transactions += 1;
                } else {
                    otherTransactions += 1;
                }
                if (transaction.gasUsed && transaction.gasPrice) {
                    const gasPaidBig = BigNumber.from(transaction.gasUsed).mul(BigNumber.from(transaction.gasPrice));

                    if (recipient) {
                        recipient.gasPaidExact = recipient.gasPaidExact.add(gasPaidBig);
                        recipient.gasUsed += parseInt(transaction.gasUsed);
                    }
                    if (sender) {
                        sender.gasPaidExact = sender.gasPaidExact.add(gasPaidBig);
                        sender.gasUsed += parseInt(transaction.gasUsed);
                    }

                    gasPaid = gasPaid.add(gasPaidBig);
                }
            }

            for (const it of senders) {
                const address = it[0];
                const sendInt = it[1];
                const sendExt = new SenderSummaryExternal();
                sendExt.sumErc20Exact = sendInt.sumErc20Exact.toString();
                sendExt.sumErc20 = bignumberToGwei(sendInt.sumErc20Exact) * 1.0e-9;
                sendExt.gasPaidExact = sendInt.gasPaidExact.toString();
                sendExt.gasPaid = bignumberToGwei(sendInt.gasPaidExact) * 1.0e-9;
                sendExt.gasUsed = sendInt.gasUsed;
                sendExt.transactionCount = sendInt.transactionCount;
                sendersExternal[address] = sendExt;
            }

            for (const it of recipients) {
                const address = it[0];
                const recInt = it[1];
                const recExt = new RecipientSummaryExternal();
                recExt.sumErc20Exact = recInt.sumErc20Exact.toString();
                recExt.sumErc20 = bignumberToGwei(recInt.sumErc20Exact) * 1.0e-9;
                recExt.gasPaidExact = recInt.gasPaidExact.toString();
                recExt.gasPaid = bignumberToGwei(recInt.gasPaidExact) * 1.0e-9;
                recExt.gasUsed = recInt.gasUsed;
                recExt.transactionCount = recInt.transactionCount;
                recipientsExternal[address] = recExt;
            }
            res.setHeader("Content-Type", "application/json");

            const resp = {
                erc20amount: (bignumberToGwei(erc20amount) * 1.0e-9).toFixed(6),
                erc20amountExact: erc20amount.toString(),
                gasPaidExact: gasPaid.toString(),
                gasPaid: (bignumberToGwei(gasPaid) * 1.0e-9).toFixed(6),
                erc20transactions: erc20transactions,
                otherTransactions: otherTransactions,
                senders: sendersExternal,
                recipients: recipientsExternal,
            };
            res.end(JSON.stringify(resp));
        } else {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(transactions));
        }
    } catch (ex) {
        res.sendStatus(404);
    }
});

app.get("/polygon/transactions/all", async (req, res) => {
    try {
        //@ts-ignore
        const block_address = req.query.address.toString();
        if (block_address) {
            const transactions = await getERC20Transactions(block_address);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(transactions));
        } else {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify("not-found"));
        }
    } catch (ex) {
        res.sendStatus(404);
    }
});

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log("The application is listening " + "on port http://localhost:" + PORT);
    });
});
