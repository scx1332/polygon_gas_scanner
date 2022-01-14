import express from 'express';
import {
    connectToDatabase,
    getBlockEntriesGreaterThan, getBlockEntriesInRange,
    getHistEntry,
    getLastBlockEntry, getLastBlocks, getLastTimeframes,
    getTimeFrameEntry
} from "./src/mongo_connector";
import * as dotenv from "dotenv";
let cors = require("cors");


const app = express();
app.use(cors());

dotenv.config();

let PORT = parseInt(process.env.SERVER_LISTEN_PORT ?? "7888");

// Handling GET / Request
app.get('/welcome_test', (req, res) => {
    res.send('Hello!');
})

class GasInfo {
    minGasPrice: string = "";
    maxMinGasPrice: string = "";
    optimalGasPrice: string = "";
    minGasPrice100: string = "";
    maxMinGasPrice100: string = "";
    minGasPrice1000: string = "";
    maxMinGasPrice1000: string = "";
    health: string = "";
    updated: string = "";
    cached: string = "";
}
let cacheValidityMs: number = 20000;

let cachedGasInfo: GasInfo | undefined;
let cachedGasInfoTime: number = 0;
app.get('/polygon/gas-info/current', async (req, res) => {
    try {
        if (Date.now() - cachedGasInfoTime > cacheValidityMs) {
            let tfe = await getTimeFrameEntry("last_10_block");
            let tfe100 = await getTimeFrameEntry("last_100_block");
            let tfe1000 = await getTimeFrameEntry("last_1000_block");
            let gasInfo = new GasInfo();
            gasInfo.cached = new Date(Date.now()).toISOString();
            gasInfo.updated = tfe.lastBlockTime;
            let lastUpdatedMsAgo = Date.now() - Date.parse(tfe.lastBlockTime);
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
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cachedGasInfo));

    } catch (ex) {
        res.sendStatus(404);
    }
})

app.get('/polygon/block-info/last-blocks', async (req, res) => {
    try {
        //@ts-ignore
        let block_count = parseInt(req.query.block_count);

        let blocks = await getLastBlocks(block_count);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(blocks));

    } catch (ex) {
        res.sendStatus(404);
    }
})


app.get('/polygon/block-info/last-time-frames', async (req, res) => {
    try {
        //@ts-ignore
        let block_count = parseInt(req.query.block_count);
        //@ts-ignore
        let timespan_seconds = parseInt(req.query.timespan_seconds);

        let timeframes = await getLastTimeframes(block_count, timespan_seconds);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(timeframes));

    } catch (ex) {
        res.sendStatus(404);
    }
})


app.get('/polygon/block-info/list', async (req, res) => {
    try {
        //let num = await getLastBlockEntry();

        //@ts-ignore
        let block_count = parseInt(req.query.block_count);
        //@ts-ignore
        let block_start = parseInt(req.query.block_start);


        let blocks = await getBlockEntriesInRange(block_start, block_start + block_count);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(blocks));

    } catch (ex) {
        res.sendStatus(404);
    }
})


app.get('/polygon/gas-info/waiting_times', async (req, res) => {
    try {
        let num = await getLastBlockEntry();

        //@ts-ignore
        let block_count = parseInt(req.query.block_count);
        //@ts-ignore
        let block_start = parseInt(req.query.block_start);


        let blocks = await getBlockEntriesInRange(block_start, block_start + block_count);

        let waiting_times = new Map<string, number>();

        for (let value = 30.00; value < 31.0; value += 0.01) {
            let max_block_wait = -1;
            let wait_time = 0;
            for (let block of blocks) {
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


        res.setHeader('Content-Type', 'application/json');
        //res.end(JSON.stringify(blocks));
        res.end(JSON.stringify({ "block_analyzed": blocks.length, "waiting_times": Object.fromEntries(waiting_times) }));

    } catch (ex) {
        res.sendStatus(404);
    }
})

app.get('/polygon/gas-info/waiting_times_avg', async (req, res) => {
    try {
        let num = await getLastBlockEntry();

        //@ts-ignore
        let block_count = parseInt(req.query.block_count);
        //@ts-ignore
        let block_start = parseInt(req.query.block_start);


        let blocks = await getBlockEntriesInRange(block_start, block_start + block_count);

        let waiting_times = new Map<string, number>();

        for (let value = 30.00; value < 31.0; value += 0.01) {
            let sum_block_wait = 0;
            let sum_block_wait_norm = 0;
            let wait_time = 0;
            for (let block of blocks) {
                if (block.minGas >= 1.0 && block.minGas <= value) {
                    sum_block_wait += wait_time * wait_time / 2.0;
                    wait_time = 0;
                }
                wait_time += 1;
                sum_block_wait_norm += 1;
            }
            waiting_times.set(value.toFixed(3), sum_block_wait / sum_block_wait_norm);
        }


        res.setHeader('Content-Type', 'application/json');
        //res.end(JSON.stringify(blocks));
        res.end(JSON.stringify({ "block_analyzed": blocks.length, "waiting_times": Object.fromEntries(waiting_times) }));

    } catch (ex) {
        res.sendStatus(404);
    }
})

app.get('/polygon/gas-info/hist10', async (req, res) => {
    try {
        let he = await getHistEntry("hist_10_block");
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(he));

    } catch (ex) {
        res.sendStatus(404);
    }
})

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log('The application is listening '
            + 'on port http://localhost:' + PORT);
    })
})

