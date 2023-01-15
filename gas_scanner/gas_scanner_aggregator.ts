import { Logger } from "tslog";
import {
    addMonitoredAddress,
    addTimeBlockDataEntry,
    clearOldVersionTimeFrameEntries,
    connectToDatabase,
    getBlockEntriesGreaterThan,
    getBlockEntriesNewerThan,
    getERC20Transactions,
    getERC20TransactionsNewerThan,
    getLastTimeframes,
    getMonitoredAddresses,
    getTimeFrameEntry,
} from "./src/mongo_connector";
import * as dotenv from "dotenv";
import { CURRENT_TIME_FRAME_BLOCK_VERSION, TimeFrameBlockData } from "./src/model/TimeFrameBlockData";
import { BlockInfo } from "./src/model/BlockInfo";
import { bignumberToGwei, delay } from "./utils";
import { MonitoredAddress, RecipientInfo } from "./src/model/MonitoredAddresses";
import { BigNumber } from "ethers";

dotenv.config();
const log = new Logger({ name: "AGGREGATOR" });

function mergeBlockIntoTimeFrameBlockData(tfs: TimeFrameBlockData, bi: BlockInfo) {
    if (bi.transCount != 0 && bi.minGas >= 1.0) {
        tfs.blockCount += 1;
        tfs.gasUsed += bi.gasUsed;
        tfs.gasLimit += bi.gasLimit;
        tfs.burnedFees += bi.burnedFees;
        tfs.totalFees += bi.totalFees;
        tfs.totalMinGas += bi.minGas;

        if (tfs.firstBlock == 0) {
            tfs.firstBlock = bi.blockNo;
        } else if (bi.blockNo < tfs.firstBlock) {
            tfs.firstBlock = bi.blockNo;
        }
        if (bi.blockNo > tfs.lastBlock) {
            tfs.lastBlock = bi.blockNo;
        }

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

function getDateFloor(date: Date, unit: string, units: number): { date: Date; timeSpanSeconds: number } {
    let years = date.getUTCFullYear();
    let months = date.getUTCMonth();
    let days = date.getUTCDate();
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    let seconds = date.getUTCSeconds();

    let timeSpanSeconds = 0;

    if (unit == "seconds") {
        seconds = seconds - (seconds % units);
        timeSpanSeconds = units;
    } else if (unit == "minutes") {
        seconds = 0;
        minutes = minutes - (minutes % units);
        timeSpanSeconds = 60 * units;
    } else if (unit == "hours") {
        seconds = 0;
        minutes = 0;
        hours = hours - (hours % units);
        timeSpanSeconds = 3600 * units;
    } else if (unit == "days") {
        seconds = 0;
        minutes = 0;
        hours = 0;
        days = days - (days % units);
        timeSpanSeconds = 24 * 3600 * units;
    }
    let res = new Date(Date.UTC(years, months, days, hours, minutes, seconds, 0));
    return { date: res, timeSpanSeconds: timeSpanSeconds };
}

async function aggregate(blocks: Array<BlockInfo>, timeFrameUnit: string, timeFrameUnits: number) {
    let startTime = new Date();
    let tfs = new TimeFrameBlockData();
    for (let blockIdx = 0; blockIdx < blocks.length; blockIdx += 1) {
        let block = blocks[blockIdx];
        //log.info(JSON.stringify(block));

        let res = getDateFloor(new Date(block.blockTime), timeFrameUnit, timeFrameUnits);
        let date_floor = res.date;
        let date_timespan = res.timeSpanSeconds;

        if (blockIdx == 0) {
            startTime = date_floor;
            tfs.timeFrameStart = startTime.toISOString();
            tfs.timeSpanSeconds = date_timespan;
        }

        mergeBlockIntoTimeFrameBlockData(tfs, block);

        if (date_floor.getTime() != startTime.getTime() || blockIdx == blocks.length - 1) {
            log.info(JSON.stringify(tfs));
            log.info(`New range found: ${date_floor.toISOString()}`);
            await addTimeBlockDataEntry(tfs);
            startTime = date_floor;
            tfs = new TimeFrameBlockData();
            tfs.timeFrameStart = date_floor.toISOString();
            tfs.timeSpanSeconds = date_timespan;
        }
    }
}

async function main() {
    log.info("Starting aggregator...");

    log.info("Connecting to database...");

    await connectToDatabase();

    let aggregator_delay_seconds = parseInt(process.env.AGGREGATOR_DELAY_SECONDS ?? "60");
    let aggregator_delay_start = parseInt(process.env.AGGREGATOR_DELAY_START ?? "60");

    log.info(`Waiting for: ${aggregator_delay_start} seconds`);
    await delay(aggregator_delay_start * 1000);
    log.info("Wait ended");

    log.info(`Clearing database form old version entries...`);
    await clearOldVersionTimeFrameEntries(CURRENT_TIME_FRAME_BLOCK_VERSION);

    while (true) {
        let params = [
            {
                timeFrameUnit: "minutes",
                timeFrameUnits: 1,
            },
            {
                timeFrameUnit: "minutes",
                timeFrameUnits: 5,
            },
            {
                timeFrameUnit: "minutes",
                timeFrameUnits: 10,
            },
            {
                timeFrameUnit: "minutes",
                timeFrameUnits: 30,
            },
            {
                timeFrameUnit: "hours",
                timeFrameUnits: 1,
            },
        ];
        let minDate: Date = new Date();
        for (let param of params) {
            let res = getDateFloor(new Date(), param.timeFrameUnit, param.timeFrameUnits);
            let lastTimeframes = await getLastTimeframes(2, res.timeSpanSeconds);
            if (lastTimeframes.length < 2) {
                //analyze all blocks when not found
                minDate = new Date(2000, 1);
                break;
            }
            for (let tf of lastTimeframes) {
                let dateCandidate = new Date(tf.timeFrameStart);
                if (dateCandidate.getTime() < minDate.getTime()) {
                    minDate = dateCandidate;
                }
            }
        }
        let blocks = await getBlockEntriesNewerThan(minDate);
        log.info(`There are ${blocks.length} returned by the database to analyze`);

        await delay(2000);

        for (let param of params) {
            await aggregate(blocks, param.timeFrameUnit, param.timeFrameUnits);
        }

        try {
            let day_before = new Date();
            day_before.setDate(day_before.getDate() - 1);
            let lastDayTransactions = await getERC20TransactionsNewerThan(day_before);
            let monitoredAddresses = await getMonitoredAddresses();
            let mapMonitoredAddresses = new Map<string, MonitoredAddress>();
            for (let el of monitoredAddresses) {
                mapMonitoredAddresses.set(el.address, el);
                el.gasFeesPaidLast24hours = 0;
                el.glmTransferredLast24hours = 0;
                el.transactionsLast24hours = 0;
                el.transactionsLastHour = 0;
                el.uniqueRecipients = {};
            }
            for (let trans of lastDayTransactions) {
                let monitoredAddress = mapMonitoredAddresses.get(trans.from.toLowerCase());
                if (!monitoredAddress) {
                    monitoredAddress = new MonitoredAddress();
                    monitoredAddress.address = trans.from.toLowerCase();
                    mapMonitoredAddresses.set(monitoredAddress.address, monitoredAddress);
                }
                monitoredAddress.transactionsLast24hours += 1;
                let gasFee = bignumberToGwei(BigNumber.from(trans.gasPrice)) * parseInt(trans.gasUsed) * 1.0e-9;
                monitoredAddress.gasFeesPaidLast24hours += gasFee;
                let glmTransferred = 0.0;
                if (trans.erc20amount != "") {
                    let erc20transferred = BigNumber.from(trans.erc20amount);
                    glmTransferred = bignumberToGwei(erc20transferred) * 1.0e-9;
                    monitoredAddress.glmTransferredLast24hours += glmTransferred;
                }
                if (glmTransferred >= 0.0 && trans.erc20to != "") {
                    if (trans.erc20to in monitoredAddress.uniqueRecipients) {
                        monitoredAddress.uniqueRecipients[trans.erc20to].glmTransferred += glmTransferred;
                        monitoredAddress.uniqueRecipients[trans.erc20to].gasFees += gasFee;
                        monitoredAddress.uniqueRecipients[trans.erc20to].transactionCount += 1;
                    } else {
                        monitoredAddress.uniqueRecipients[trans.erc20to] = new RecipientInfo();
                        monitoredAddress.uniqueRecipients[trans.erc20to].glmTransferred = glmTransferred;
                        monitoredAddress.uniqueRecipients[trans.erc20to].gasFees = gasFee;
                        monitoredAddress.uniqueRecipients[trans.erc20to].transactionCount = 1;
                    }
                }
            }
            for (let el of monitoredAddresses) {
                await addMonitoredAddress(el);
            }
        } catch (ex) {
            log.error(`Failed to aggreagate transactions ${ex}`);
        }

        log.info(`Waiting for: ${aggregator_delay_seconds} seconds`);
        await delay(aggregator_delay_seconds * 1000);
        log.info("Wait ended");
    }
}

main()
    .then((text) => {
        log.info("Aggregator finished");
    })
    .catch((err) => {
        log.error(`Aggregator finished with error: ${err}`);
    });
