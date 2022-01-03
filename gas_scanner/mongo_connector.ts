import * as mongoDB from "mongodb";
import {BlockList} from "net";
import {BlockStatistics, TimeFrameStatistics} from "./gas_scanner";


export const collections: {
    blockInfoCollection?: mongoDB.Collection,
    timeFrameInfoCollection?: mongoDB.Collection
} = {}


export async function connectToDatabase() {
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

    return client;
}

export async function addBlockEntry(entry : BlockStatistics) {
    if (collections.blockInfoCollection !== undefined) {
        const result = await collections.blockInfoCollection.insertOne(entry);
    }
}

export async function addTimeFrameEntry(entry : TimeFrameStatistics) {
    if (collections.timeFrameInfoCollection !== undefined) {
        const result = await collections.timeFrameInfoCollection.insertOne(entry);
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



