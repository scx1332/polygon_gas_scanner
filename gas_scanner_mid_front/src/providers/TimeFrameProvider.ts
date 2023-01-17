export class TimeFrameDataEntry {
    timeFrameStart: string = "";
    gasUsed: number = 0;
    gasLimit: number = 0;
    minGas: number = 0;
}

export class TimeFrameProviderResult {
    timeFrameData60 = new Array<TimeFrameDataEntry>();
    timeFrameData3600 = new Array<TimeFrameDataEntry>();
    error: string = "";

    constructor(timeFrameData60: Array<TimeFrameDataEntry>, timeFrameData3600: Array<TimeFrameDataEntry>, error: string) {
        this.timeFrameData60 = timeFrameData60;
        this.timeFrameData3600 = timeFrameData3600;
        this.error = error;
    }
}

const pollingInterval = parseInt(process.env.REACT_APP_CHECK_AVG_DATA_INTERVAL ?? "30000");

const defaultData =
    [
        {"blockCount":1247,"minGas":30,"maxMinGas":113,"gasUsed":17227522419,"gasLimit":19552856050,"transCount":143978,"timeFrameStart":"2022-01-13T14:00:00.000Z","timeSpanSeconds":3600,"firstBlock":23673480,"lastBlock":23674735,"_id":"61e03d71d198935f64589680"},
        {"blockCount":1619,"minGas":5,"maxMinGas":180,"gasUsed":20355904377,"gasLimit":25433646641,"transCount":178055,"timeFrameStart":"2022-01-13T13:00:00.000Z","timeSpanSeconds":3600,"firstBlock":23671860,"lastBlock":23673479,"_id":"61e03d72d198935f64589716"},
        {"blockCount":1617,"minGas":30,"maxMinGas":145,"gasUsed":20876762015,"gasLimit":26527056132,"transCount":187123,"timeFrameStart":"2022-01-13T12:00:00.000Z","timeSpanSeconds":3600,"firstBlock":23670239,"lastBlock":23671859,"_id":"61e03d72d198935f64589715"},
        {"blockCount":1616,"minGas":5,"maxMinGas":128.4,"gasUsed":23568599774,"gasLimit":25250748722,"transCount":194624,"timeFrameStart":"2022-01-13T11:00:00.000Z","timeSpanSeconds":3600,"firstBlock":23668618,"lastBlock":23670238,"_id":"61e03d72d198935f64589714"},
        {"blockCount":1492,"minGas":30,"maxMinGas":200,"gasUsed":20733209497,"gasLimit":23751778479,"transCount":180567,"timeFrameStart":"2022-01-13T10:00:00.000Z","timeSpanSeconds":3600,"firstBlock":23667124,"lastBlock":23668617,"_id":"61e03d72d198935f64589713"}
    ];

export class TimeFrameProvider {
    observers  = new Array<any>();
    interval : NodeJS.Timer;

    data = defaultData;

    timeFrameData60 = new Array<TimeFrameDataEntry>();
    timeFrameData3600 = new Array<TimeFrameDataEntry>();

    constructor() {
        this.interval = setTimeout(async () => await this.tick(), 300);
    }
    attach(observer : any) {
        this.observers.push(observer);
    }
    detach(observerToRemove: any) {
        this.observers = this.observers.filter(observer => observerToRemove !== observer);
    }

    async fetchLastTimeFrames(timespan_seconds: number) {
        let lastBLocks = 100;
        const BACKEND_URL = "http://145.239.69.80:8899";
        const res = await fetch(`${BACKEND_URL}/polygon/block-info/last-time-frames?block_count=${lastBLocks}&timespan_seconds=${timespan_seconds}`);
        let json_result = await res.json();
        return json_result;
        //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
    }


    async tick() {
        try {
            if (this.observers.length == 0) {
                //console.log("BlockListProvider: inactive due to lack of observers");
                return;
            }

            let timeFrameData60 = await this.fetchLastTimeFrames(60);
            let timeFrameData3600 = await this.fetchLastTimeFrames(3600);
            console.log("TimeFrameProvider: " + timeFrameData60);
            let succeeded = false;
            if (Array.isArray(timeFrameData60) && timeFrameData60.length > 0) {
                timeFrameData60.sort((firstEl, secondEl) => firstEl.timeFrameStart.localeCompare(secondEl.timeFrameStart) );

                this.timeFrameData60 = timeFrameData60;
                succeeded = true;
            }
            if (Array.isArray(timeFrameData3600) && timeFrameData3600.length > 0) {
                timeFrameData3600.sort((firstEl, secondEl) => firstEl.timeFrameStart.localeCompare(secondEl.timeFrameStart) );

                this.timeFrameData3600 = timeFrameData3600;
                succeeded = true;
            }
            if (succeeded) {
                this.notify(new TimeFrameProviderResult(this.timeFrameData60, this.timeFrameData3600, ""));
            }
            else {
                this.notify(new TimeFrameProviderResult(this.timeFrameData60, this.timeFrameData3600, "Data source responded with empty data"));
            }
        } catch (ex) {
            this.notify(new TimeFrameProviderResult(this.timeFrameData60, this.timeFrameData3600, `Error when downloading data from datasource: ${ex}`));
        } finally {
            this.interval = setTimeout(async () => await this.tick(), pollingInterval);
        }
    }

    notify(timeFrameDataResult : TimeFrameProviderResult) {
        this.observers.forEach(observer => observer.updateTimeFrameData(timeFrameDataResult));
    }
}
const timeFrameProvider = new TimeFrameProvider();
export default timeFrameProvider;