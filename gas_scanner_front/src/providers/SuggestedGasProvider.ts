import {TimeFrameDataEntry, TimeFrameProviderResult} from "./TimeFrameProvider";


export class SuggestedGasEntry {
    minGasPrice: number = 0;
    maxMinGasPrice: number = 0;
    optimalGasPrice: number = 0;
    minGasPrice100: number = 0;
    maxMinGasPrice100: string = "";
    minGasPrice1000: number = 0;
    maxMinGasPrice1000: number = 0;
    health: string = "";
    updated: string = "";
    cached: string = "";
}

export class SuggestedGasResult {
    gasEntry?: SuggestedGasEntry;
    error?: string;

    constructor(gasEntry? : SuggestedGasEntry, error?: string) {
        this.gasEntry = gasEntry;
        this.error = error;
    }
}

const pollingInterval = parseInt(process.env.REACT_APP_CHECK_GAS_PRICE_INTERVAL ?? "30000");

let defaultData = {"minGasPrice":"68.36","maxMinGasPrice":"74.51","optimalGasPrice":"68.43","minGasPrice100":"68.36","maxMinGasPrice100":"88.48","minGasPrice1000":"68.36","maxMinGasPrice1000":"88.48","health":"Info outdated 208169 seconds","updated":"2022-01-18T04:28:03.000Z","cached":"2022-01-20T14:17:31.995Z"};

export class SuggestedGasProvider {
    observers  = new Array<any>();
    interval : NodeJS.Timer;

    suggestedGasData : SuggestedGasEntry | undefined;

    constructor() {
        this.interval = setTimeout(async () => await this.tick(), 100);
    }
    attach(observer : any) {
        this.observers.push(observer);
    }
    detach(observerToRemove: any) {
        this.observers = this.observers.filter(observer => observerToRemove !== observer);
    }

    async fetchSuggestedGas() {
        let lastBLocks = 100;
        const BACKEND_URL = "http://145.239.69.80:8899";
        const res = await fetch(`${BACKEND_URL}/polygon/gas-info/current`);
        let json_result = await res.json();
        return json_result;
        //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
    }


    async tick() {
        try {
            let suggestedGasData = await this.fetchSuggestedGas();
            this.suggestedGasData = suggestedGasData;
            this.notify(new SuggestedGasResult(this.suggestedGasData, undefined));
        } catch (ex) {
            this.notify(new SuggestedGasResult(undefined, `Error when downloading data from datasource: ${ex}`));
        } finally {
            this.interval = setTimeout(async () => await this.tick(), pollingInterval);
        }

    }

    notify(suggestedGasResult : SuggestedGasResult) {
        this.observers.forEach(observer => observer.updateSuggestedGasResult(suggestedGasResult));
    }
}
const suggestedGasProvider = new SuggestedGasProvider();
export default suggestedGasProvider;

