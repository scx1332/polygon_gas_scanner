import {ChainGasScanner} from "./gas_scanner";
import {delay} from "./utils";
import * as dotenv from 'dotenv';
import { parse } from 'ts-command-line-args';
//const client: mongoDB.MongoClient = new mongoDB.MongoClient(MONGO_DB_CONNECTION_STRING);

//load config from .env
dotenv.config();

const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS as string;

/*
interface IGasScannerArguments{
    providerAddress: string;
}
export const args = parse<IGasScannerArguments>({
    providerAddress: String,
});
*/

(async () => {
    console.log("Starting gas scanner...");




    let p = new ChainGasScanner(PROVIDER_ADDRESS);

    p.runWorkers();

    while (true) {
        await delay(100000);
    }
})();