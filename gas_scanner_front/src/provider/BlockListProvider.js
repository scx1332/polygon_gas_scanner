import React from 'react';


class BlockListObserver {

}
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
    observers  = [];
    interval : NodeJS.Timer;

    data = defaultData;

    constructor() {
        this.interval = setInterval(async () => await this.tick(), 2000);
    }
    attach(observer: BlockListObserver) {
        this.observers.push(observer);
    }
    detach(observerToRemove: BlockListObserver) {
        this.observers = this.observers.filter(observer => observerToRemove != observer);
    }

    async fetchLastBlocks() {
        const res = await fetch("http://localhost:7888/polygon/block-info/last-blocks?block_count=30");
        //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
        let json_result = await res.json();
        return json_result;
    }

    async tick() {
        let blockData = await this.fetchLastBlocks();
        console.log("Block list provider: " + blockData);
        if (Array.isArray(blockData)) {
            blockData.sort((firstEl, secondEl) => firstEl.blockNo - secondEl.blockNo );

            this.notify(blockData);
        }
    }

    notify(blockData) {
        this.observers.forEach(observer => observer.updateBlockData(blockData));
    }
}
const blockListProvider = new BlockListProvider();
export default blockListProvider;