import {ChainGasScanner} from "./gas_scanner";
import {delay} from "./utils";
import * as dotenv from 'dotenv';
import { parse } from 'ts-command-line-args';
import {clearDatabase, connectToDatabase} from "./mongo_connector";

//load config from .env

interface IGasScannerArguments{
    clearDatabase: boolean;
    help?: boolean;
}
export const args = parse<IGasScannerArguments>(
    {
        clearDatabase: Boolean,
        help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide' },
    },
    {
        helpArg: 'help',
        headerContentSections: [{ header: 'My Example Config', content: 'Thanks for using Our Awesome Library' }],
        footerContentSections: [{ header: 'Footer', content: `Copyright: Big Faceless Corp. inc.` }],
    },
);

dotenv.config();

const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS as string;

(async () => {
    console.log("Starting gas scanner...");

    console.log("Connecting to database...");
    await connectToDatabase();

    if (args.clearDatabase) {
        console.log("Clear all database entries (remove for production)...");
        await clearDatabase();
    }

    let p = new ChainGasScanner(PROVIDER_ADDRESS);

    p.runWorkers();

    while (true) {
        await delay(100000);
    }
})();