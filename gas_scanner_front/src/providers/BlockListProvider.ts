export class BlockDataEntry {
    blockNo: number = 0;
    minGas: number = 0;
    gasUsed: number = 0;
    gasLimit: number = 0;
    blockTime: string = "";
    baseFeePrice: number = 0;
}

export class BlockListProviderResult {
    blockData: Array<BlockDataEntry> = new Array<BlockDataEntry>();
    error: string = "";
}

const pollingInterval = parseInt(process.env.REACT_APP_CHECK_BLOCK_LIST_INTERVAL ?? "30000");
const defaultData =
    [
        {"blockNo":23568293,"minGas":30,"gasUsed":13394423,"gasLimit":15384954,"transCount":60,"blockTime":"2022-01-10T20:09:44.000Z","blockVer":2,"_id":"61dd8b79ea4d960fb7fb4d35"},
        {"blockNo":23568292,"minGas":30.1,"gasUsed":11161378,"gasLimit":15399992,"transCount":79,"blockTime":"2022-01-10T20:09:42.000Z","blockVer":2,"_id":"61dd8b78ea4d960fb7fb4d34"},
        {"blockNo":23568291,"minGas":30,"gasUsed":11587819,"gasLimit":15415044,"transCount":121,"blockTime":"2022-01-10T20:09:40.000Z","blockVer":2,"_id":"61dd8b78ea4d960fb7fb4d33"},
        {"blockNo":23568290,"minGas":30.000000001,"gasUsed":15412659,"gasLimit":15430111,"transCount":124,"blockTime":"2022-01-10T20:09:38.000Z","blockVer":2,"_id":"61dd8b78ea4d960fb7fb4d32"},
        {"blockNo":23568289,"minGas":30.1,"gasUsed":15413163,"gasLimit":15445193,"transCount":175,"blockTime":"2022-01-10T20:09:36.000Z","blockVer":2,"_id":"61dd8b77ea4d960fb7fb4d31"},
        {"blockNo":23568288,"minGas":30,"gasUsed":10033566,"gasLimit":15460289,"transCount":63,"blockTime":"2022-01-10T20:09:34.000Z","blockVer":2,"_id":"61dd8b77ea4d960fb7fb4d30"},
        {"blockNo":23568287,"minGas":30,"gasUsed":10190587,"gasLimit":15475400,"transCount":56,"blockTime":"2022-01-10T20:09:32.000Z","blockVer":2,"_id":"61dd8b76ea4d960fb7fb4d2f"},
        {"blockNo":23568286,"minGas":30,"gasUsed":13958375,"gasLimit":15490526,"transCount":88,"blockTime":"2022-01-10T20:09:30.000Z","blockVer":2,"_id":"61dd8b76ea4d960fb7fb4d2e"},
        {"blockNo":23568285,"minGas":30,"gasUsed":10811569,"gasLimit":15505667,"transCount":56,"blockTime":"2022-01-10T20:09:28.000Z","blockVer":2,"_id":"61dd8b75ea4d960fb7fb4d2d"},
        {"blockNo":23568284,"minGas":30,"gasUsed":8485065,"gasLimit":15520823,"transCount":51,"blockTime":"2022-01-10T20:09:26.000Z","blockVer":2,"_id":"61dd8b75ea4d960fb7fb4d2c"}
    ];

export class BlockListProvider {
    observers = new Array<any>();
    interval : NodeJS.Timer;

    data = defaultData;

    blockData = new Array<BlockDataEntry>();

    constructor() {
        this.interval = setTimeout(async () => await this.tick(), 100);
    }
    attach(observer : any) {
        this.observers.push(observer);
    }
    detach(observerToRemove: any) {
        this.observers = this.observers.filter(observer => observerToRemove !== observer);
    }

    async fetchLastBlocks() : Promise<Array<BlockDataEntry>> {
        let lastBLocks = 10;
        if (this.blockData.length < 100) {
          lastBLocks = 200;

        }
        const BACKEND_URL = "http://145.239.69.80:8899";
        const res = await fetch(`${BACKEND_URL}/polygon/block-info/last-blocks?block_count=${lastBLocks}`);
        let json_result = await res.json();
        return json_result;
        //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
    }

    async tick() {
        try {
            if (this.observers.length == 0) {
                console.log("BlockListProvider: inactive due to lack of observers");
                return;
            }

            let blockData = await this.fetchLastBlocks();
            console.log("BlockListProvider: Downloaded blockdata: " + blockData);
            if (Array.isArray(blockData) && blockData.length > 0) {
                blockData.sort((firstEl, secondEl) => firstEl.blockNo - secondEl.blockNo );

                let mergeDataSuccess = false;
                let currentBlockNo = 0;
                let newDataBlockStart = blockData[0].blockNo;
                for (let idx = 0; idx < this.blockData.length; idx += 1) {
                    let existingBlock = this.blockData[idx];
                    if (currentBlockNo === 0) {
                        currentBlockNo = existingBlock.blockNo;
                    }
                    /*              if (existingBlock.blockNo - currentBlockNo > 10) {
                                    console.error(`ERror; ${existingBlock.blockNo - currentBlockNo}`);
                                    mergeDataSuccess = false;
                                    break;
                                  }*/
                    currentBlockNo = existingBlock.blockNo;
                    if (existingBlock.blockNo >= newDataBlockStart) {
                        for (let newIdx = 0; newIdx < blockData.length; newIdx += 1) {
                            let fixIdx = idx + newIdx;
                            if (fixIdx < this.blockData.length) {
                                this.blockData[fixIdx] = blockData[newIdx];
                            } else {
                                this.blockData.push(blockData[newIdx]);
                            }
                        }
                        mergeDataSuccess = true;
                        break;
                    }
                }


                if (!mergeDataSuccess) {
                    this.blockData = blockData;
                }

                let providerResult = new BlockListProviderResult();
                providerResult.blockData = this.blockData;
                providerResult.error = "";

                this.notify(providerResult);
            } else {
                let providerResult = new BlockListProviderResult();
                providerResult.blockData = this.blockData;
                providerResult.error = "Source responded with empty result";

                this.notify(providerResult);
            }
        } catch (ex) {
            let providerResult = new BlockListProviderResult();
            providerResult.blockData = [];
            providerResult.error = "Error when fetching data: " + ex;
            this.notify(providerResult);
        } finally {
            this.interval = setTimeout(async () => await this.tick(), pollingInterval);
        }

    }

    notify(providerResult : BlockListProviderResult) {
        this.observers.forEach(observer => observer.updateBlockList(providerResult));
    }
}
const blockListProvider = new BlockListProvider();
export default blockListProvider;