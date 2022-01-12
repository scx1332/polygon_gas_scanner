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
import blockListProvider from "../provider/BlockListProvider";
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
            text: 'GasChart.js Bar Chart',
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

export class GasChartAverage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            seconds: parseInt(props.startTimeInSeconds, 10) || 0,
            chartData: defaultData
        };
    }

    updateBlockData(blockData) {
        let labels = [];
        let minGasArray = [];
        let backgroundColors = [];

        let lastBlockAvgStart = 0;
        let aggregateCount = 0;
        let minimumGas = 0;
        let groupCount = 30;
        for (let blockDataIdx = 0; blockDataIdx < blockData.length; blockDataIdx += 1) {
            let blockEntry = blockData[blockDataIdx];
            let blockAvgStart = Math.round(blockEntry.blockNo / groupCount) * groupCount;
            if (lastBlockAvgStart === 0) {
                lastBlockAvgStart = blockAvgStart;
                aggregateCount = 0;
            }
            if (blockEntry.gasUsed / blockEntry.gasLimit < 0.95) {
                backgroundColors.push("green");
            } else {
                backgroundColors.push("red");
            }
            if (blockEntry.minGas >= 1.0) {
                if (minimumGas === 0) {
                    minimumGas = blockEntry.minGas;
                } else {
                    minimumGas = Math.min(minimumGas, blockEntry.minGas);
                }
            }
            aggregateCount += 1
            if (aggregateCount === groupCount || blockDataIdx === blockData.length - 1) {
                labels.push(blockAvgStart);
                minGasArray.push(minimumGas);
                lastBlockAvgStart = blockAvgStart;
                aggregateCount = 0;
                minimumGas = 0;
            }
        }
        let datasets = [
            {
                label: "Min gas",
                data: minGasArray,
                backgroundColor: backgroundColors
            }
        ];

        this.setState({chartData: {labels: labels, datasets: datasets}});
        console.log("Update block data: " + blockData);
    }

    async fetchPrices() {
        //const res = await fetch("http://145.239.69.80:8899/polygon/gas-info/hist10");
        const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
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
        blockListProvider.attach(this);
    }

    componentWillUnmount() {
        blockListProvider.detach(this);
    }

    formatTime(secs) {
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
                            duration: 0
                        }}} data={this.state.chartData}/>
                </div>
            </div>

        );
    }
}