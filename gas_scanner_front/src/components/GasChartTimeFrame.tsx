import React from 'react';
import "./GasChart.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
//@ts-ignore
import timeFrameProvider from "../provider/TimeFrameProvider";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'GasChart.tsx Bar Chart',
        },
    },
};


const defaultData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
        {
            label: 'Dataset 1',
            data: [0,1,2,3,4,5],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
    ],
};
const moment = require('moment');

class TimeFrameData {
    timeFrameStart: string = "";
    gasUsed: number = 0;
    gasLimit: number = 0;

}

class GasChartAverageState {
    seconds: number = 0;
    chartData: any;
}

export class GasChartAverageTimeFrame extends React.Component {
    state = new GasChartAverageState();
    constructor(props : any) {
        super(props);
        this.state.seconds = parseInt(props.startTimeInSeconds, 10) || 0;
        this.state.chartData = defaultData;
    }

    updateTimeFrameData(timeFrameData : Array<TimeFrameData>) {
        let labels = [];
        let minGasArray = [];
        let backgroundColors = new Array<string>();

        let lastBlockAvgStart = 0;
        let aggregateCount = 0;
        let minimumGas = 0;
        let groupCount = 30;
        for (let blockDataIdx = Math.max(0, timeFrameData.length - 24); blockDataIdx < timeFrameData.length; blockDataIdx += 1) {
            let blockEntry = timeFrameData[blockDataIdx];

            let dt = new Date(blockEntry.timeFrameStart);
            if (dt.getHours() == 0) {
                labels.push(moment(dt).format("MMM-DD HH:mm"));
            } else {
                labels.push(moment(dt).format("HH:mm"));
            }
            minGasArray.push(blockEntry.gasUsed / blockEntry.gasLimit);
            backgroundColors.push("black");
            aggregateCount = 0;
            minimumGas = 0;
        }
        let datasets = [
            {
                label: "Min gas",
                data: minGasArray,
                backgroundColor: backgroundColors
            }
        ];

        this.setState({chartData: {labels: labels, datasets: datasets}});
        console.log("Update block data: " + timeFrameData);
    }

    async fetchPrices() {
        //const res = await fetch("http://145.239.69.80:8899/polygon/gas-info/hist10");
        const res = await fetch("");
        const data = await res.json();
        console.log(data);
        return {
            labels: data.blockNums,
            datasets: [{
                label: "Min gas",
                data: data.minGas,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: "Usage",
                data: data.blockFill,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            ]
        };
    }

    componentDidMount() {
        timeFrameProvider.attach(this);
    }

    componentWillUnmount() {
        timeFrameProvider.detach(this);
    }

    formatTime(secs : number) {
        let hours   = Math.floor(secs / 3600);
        let minutes = Math.floor(secs / 60) % 60;
        let seconds = secs % 60;
        return [hours, minutes, seconds]
            .map(v => ('' + v).padStart(2, '0'))
            .filter((v,i) => v !== '00' || i > 0)
            .join(':');
    }

    render() {
        return (
            <div>
                <div>
                    <h1>Live {} blocks average</h1> (Timer: {this.formatTime(this.state.seconds)})
                </div>
                <div>
                    <Bar options={{animation: {
                            duration: 0,
                        }}} data={this.state.chartData}/>
                </div>
            </div>

        );
    }
}