import express from 'express';
import {connectToDatabase, getTimeFrameEntry} from "./mongo_connector";
import * as dotenv from "dotenv";

const app = express();

dotenv.config();

let PORT = parseInt(process.env.SERVER_LISTEN_PORT ?? "7888");

// Handling GET / Request
app.get('/welcome_test', (req, res) => {
    res.send('Hello!');
})

class GasInfo {
    minGasPrice: string = "";
    optimalGasPrice: string = "";
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
            let gasInfo = new GasInfo();
            gasInfo.cached = new Date(Date.now()).toISOString();
            gasInfo.updated = tfe.lastBlockTime;
            let lastUpdatedMsAgo = Date.now() - Date.parse(tfe.lastBlockTime);
            if (lastUpdatedMsAgo > 60000){
                gasInfo.health = "Info outdated " + (lastUpdatedMsAgo / 1000.0).toFixed(0) + " seconds";
            } else {
                gasInfo.health = "OK";
            }
            gasInfo.minGasPrice = tfe.minGas.toFixed(2);
            gasInfo.optimalGasPrice = (tfe.minGas * 1.001).toFixed(2);
            cachedGasInfo = gasInfo;
            cachedGasInfoTime = Date.now();
        }
        res.send(cachedGasInfo);
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

