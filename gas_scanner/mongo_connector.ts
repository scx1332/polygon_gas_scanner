import * as mongoDB from "mongodb";
import { BlockList } from "net";
import { BlockInfo, MinGasBlocksHistogram, TimeFrameStatistics } from "./gas_scanner";


export const collections: {
    blockInfoCollection?: mongoDB.Collection,
    timeFrameInfoCollection?: mongoDB.Collection,
    histogramCollection?: mongoDB.Collection
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



