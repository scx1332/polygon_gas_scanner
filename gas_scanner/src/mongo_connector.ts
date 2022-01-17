import * as mongoDB from "mongodb";
import { BlockInfo } from "./model/BlockInfo";
import { TimeFrameBlockData } from "./model/TimeFrameBlockData";
import { TimeFrameStatistics } from "./model/TimeFrameStatistics";
import { MinGasBlocksHistogram } from "./model/MinGasBlocksHistogram";
import {TransactionERC20Entry} from "./model/TransactionEntry";


export const collections: {
    blockInfoCollection?: mongoDB.Collection,
    timeFrameInfoCollection?: mongoDB.Collection,
    histogramCollection?: mongoDB.Collection,
    timeFrameBlockDataCollection?: mongoDB.Collection,
    erc20Transactions?: mongoDB.Collection
} = {}


export async function connectToDatabase(): Promise<mongoDB.MongoClient> {
    if (process.env.MONGO_DB_CONNECTION_STRING === undefined) {
        throw "process.env.MONGO_DB_CONNECTION_STRING not found";
    }
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.MONGO_DB_CONNECTION_STRING);

    await client.connect();

    if (process.env.MONGO_DB_NAME === undefined) {
        throw "process.env.MONGO_DB_NAME not found";
    }
    const db: mongoDB.Db = client.db(process.env.MONGO_DB_NAME);

    collections.blockInfoCollection = db.collection("BlockInfo");
    collections.timeFrameInfoCollection = db.collection("TimeFrameInfo");
    collections.histogramCollection = db.collection("Histograms");
    collections.timeFrameBlockDataCollection = db.collection("TimeFrameBlockData");
    collections.erc20Transactions = db.collection("ERC20Transaction");

    return client;
}

export async function getLastBlockEntry(): Promise<number> {
    if (collections.blockInfoCollection !== undefined) {
        const result = await collections.blockInfoCollection.find().sort({ blockNo: -1 }).limit(1).toArray();
        if (result.length == 1) {
            return result[0].blockNo;
        }
    }
    return -1;
}

export async function getLastBlocks(num: number): Promise<Array<BlockInfo>> {
    let array = new Array<BlockInfo>();
    if (collections.blockInfoCollection !== undefined) {
        const result = await collections.blockInfoCollection.find().sort({ blockNo: -1 }).limit(num).toArray();
        for (let res of result) {
            array.push(Object.assign(new BlockInfo(), res));
        }
    }
    return array;
}

export async function getLastTimeframes(num: number, timeSpanSeconds: number): Promise<Array<TimeFrameBlockData>> {
    let array = new Array<TimeFrameBlockData>();
    if (collections.timeFrameBlockDataCollection !== undefined) {
        const result = await collections.timeFrameBlockDataCollection.find({ timeSpanSeconds: { "$eq": timeSpanSeconds } }).sort({ timeFrameStart: -1 }).limit(num).toArray();
        for (let res of result) {
            array.push(Object.assign(new TimeFrameBlockData(), res));
        }
    }
    return array;
}

export async function getBlockEntriesGreaterThan(minBlock: number): Promise<Array<BlockInfo>> {
    let array = new Array<BlockInfo>();
    if (collections.blockInfoCollection !== undefined) {
        const result = await collections.blockInfoCollection.find({ "blockNo": { $gt: minBlock } }).sort({ blockNo: -1 }).toArray();
        for (let res of result) {
            array.push(Object.assign(new BlockInfo(), res));
        }
    }
    return array;
}

export async function getBlockEntriesNewerThan(minDate: Date): Promise<Array<BlockInfo>> {
    let array = new Array<BlockInfo>();
    if (collections.blockInfoCollection !== undefined) {
        const result = await collections.blockInfoCollection.find({ "blockTime": { $gt: minDate.toISOString() } }).sort({ blockNo: -1 }).toArray();
        for (let res of result) {
            array.push(Object.assign(new BlockInfo(), res));
        }
    }
    return array;
}


export async function getBlockEntriesInRange(minBlock: number, maxBlock: number): Promise<Array<BlockInfo>> {
    let array = new Array<BlockInfo>();
    if (collections.blockInfoCollection !== undefined) {
        const result = await collections.blockInfoCollection.find({ "blockNo": { $gte: minBlock, $lt: maxBlock } }).sort({ blockNo: 1 }).toArray();
        for (let res of result) {
            array.push(Object.assign(new BlockInfo(), res));
        }
    }
    return array;
}

export async function addBlockEntry(entry: BlockInfo) {
    if (collections.blockInfoCollection !== undefined) {
        const el = await collections.blockInfoCollection.findOne({ blockNo: entry.blockNo });
        if (el == null) {
            const result = await collections.blockInfoCollection.insertOne(entry);
        } else {
            const result = await collections.blockInfoCollection.replaceOne({ _id: el._id }, entry);
        }
    }
}

export async function addTimeBlockDataEntry(entry: TimeFrameBlockData) {
    if (collections.timeFrameBlockDataCollection !== undefined) {
        const el = await collections.timeFrameBlockDataCollection.findOne({
            timeFrameStart: entry.timeFrameStart,
            timeSpanSeconds: entry.timeSpanSeconds
        });
        if (el == null) {
            const result = await collections.timeFrameBlockDataCollection.insertOne(entry);
        } else {
            //TODO - reduce unnecessery updates by comparing objects
            /*const entryClone = Object.assign({}, entry);
            //@ts-ignore
            entryClone._id = el._id;
            if (JSON.stringify(entryClone) != JSON.stringify(el)) {
                //console.log("No need updating object: " + JSON.stringify(entryClone));
            }*/
            const result = await collections.timeFrameBlockDataCollection.replaceOne({ _id: el._id }, entry);
        }
    }
}

export async function getTimeFrameEntry(name: string): Promise<TimeFrameStatistics> {
    if (collections.timeFrameInfoCollection !== undefined) {
        const el = await collections.timeFrameInfoCollection.findOne({ name: name });
        return Object.assign(new TimeFrameStatistics(), el);
    }
    throw "collections.timeFrameInfoCollection undefined";
}

export async function getHistEntry(name: string): Promise<MinGasBlocksHistogram> {
    if (collections.histogramCollection !== undefined) {
        const el = await collections.histogramCollection.findOne({ name: name });
        return Object.assign(new MinGasBlocksHistogram(), el);
    }
    throw "collections.timeFrameInfoCollection undefined";
}

export async function updateHistEntry(entry: MinGasBlocksHistogram) {
    if (collections.histogramCollection !== undefined) {
        const el = await collections.histogramCollection.findOne({ name: entry.name });
        if (el == null) {
            const result = await collections.histogramCollection.insertOne(entry);
        } else {
            const result = await collections.histogramCollection.replaceOne({ _id: el._id }, entry);
        }
    }
}

export async function updateTimeFrameEntry(entry: TimeFrameStatistics) {
    if (collections.timeFrameInfoCollection !== undefined) {
        const el = await collections.timeFrameInfoCollection.findOne({ name: entry.name });
        if (el == null) {
            const result = await collections.timeFrameInfoCollection.insertOne(entry);
        } else {
            const result = await collections.timeFrameInfoCollection.replaceOne({ _id: el._id }, entry);
        }
    }
}

export async function clearDatabase() {
    if (collections.timeFrameInfoCollection !== undefined) {
        await collections.timeFrameInfoCollection.deleteMany({});
    }
    if (collections.blockInfoCollection !== undefined) {
        await collections.blockInfoCollection.deleteMany({});
    }
}


export async function addERC20TransactionEntry(entry: TransactionERC20Entry) {
    if (collections.erc20Transactions !== undefined) {
        const el = await collections.erc20Transactions.findOne({
            txid: entry.txid,
        });
        if (el == null) {
            const result = await collections.erc20Transactions.insertOne(entry);
        } else {
            //TODO - reduce unnecessery updates by comparing objects
            /*const entryClone = Object.assign({}, entry);
            //@ts-ignore
            entryClone._id = el._id;
            if (JSON.stringify(entryClone) != JSON.stringify(el)) {
                //console.log("No need updating object: " + JSON.stringify(entryClone));
            }*/
            const result = await collections.erc20Transactions.replaceOne({ _id: el._id }, entry);
        }
    }
}


