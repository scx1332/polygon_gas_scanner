import React from 'react';
import "./GasChart.css";
import { useEffect, useState } from "react"
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
// @ts-ignore
import blockListProvider, {BlockDataEntry, BlockListProviderResult} from "../provider/BlockListProvider";
import {Flex, Button} from "@chakra-ui/react";
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


class GasChartState {
    seconds: number = 0;
    chartData: any;
    displayMode: string;
    numberOnChart: number;

    constructor(seconds: number, chartData: any, displayMode: string, numberOnChart: number) {
        this.seconds = seconds;
        this.chartData = chartData;
        this.displayMode = displayMode;
        this.numberOnChart = numberOnChart;
    }
}


export class GasChart extends React.Component {
    state : GasChartState;

    lastResult : BlockListProviderResult | undefined;

    constructor(props : any) {
        super(props);
        this.state = new GasChartState(0, defaultData, "total_fee", 50);
    }
    updateBlockList(blockListProviderResult: BlockListProviderResult) {
        this.lastResult = blockListProviderResult;
        this.updateBlockListPrivate(this.lastResult);
    }

    private updateBlockListPrivate(blockListProviderResult: BlockListProviderResult) {
        let labels = [];
        let minGasArray = [];
        let backgroundColors = [];
        let blockData = blockListProviderResult.blockData;

        for (let blockEntry of blockData.slice(blockData.length - this.state.numberOnChart)) {
            labels.push(blockEntry.blockNo);
            if (this.state.displayMode == "total_fee") {
                minGasArray.push(blockEntry.minGas);
            }
            if (this.state.displayMode == "base_fee") {
                minGasArray.push(blockEntry.baseFeePrice);
            }
            if (this.state.displayMode == "priority_fee") {
                minGasArray.push(blockEntry.minGas - blockEntry.baseFeePrice);
            }


            if (blockEntry.gasUsed / blockEntry.gasLimit < 0.51) {
                backgroundColors.push("green");
            } else {
                backgroundColors.push("red");
            }
        }
        let datasets = [
            {
                label: "Min gas",
                data: minGasArray,
                backgroundColor: backgroundColors
            }
        ];

        this.setState(new GasChartState(0, {labels: labels, datasets: datasets}, this.state.displayMode, this.state.numberOnChart));
        //console.log("Update block data: " + blockData);
    }

    private async fetchPrices() {
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

    public componentDidMount() {
        blockListProvider.attach(this);
    }

    public componentWillUnmount() {
        blockListProvider.detach(this);
    }

    private formatTime(secs : number) {
        let hours   = Math.floor(secs / 3600);
        let minutes = Math.floor(secs / 60) % 60;
        let seconds = secs % 60;
        return [hours, minutes, seconds]
            .map(v => ('' + v).padStart(2, '0'))
            .filter((v,i) => v !== '00' || i > 0)
            .join(':');
    }
    private handleClick(displayMode:string) {
        this.setState(new GasChartState(this.state.seconds, this.state.chartData, displayMode, this.state.numberOnChart), () => {
            if (this.lastResult)
            {
                this.updateBlockListPrivate(this.lastResult);
            }
            }); // needs to do -1 if the button is clicked already
        }
    private handleClick2(number:number) {
        this.setState(new GasChartState(this.state.seconds, this.state.chartData, this.state.displayMode, number), () => {
            if (this.lastResult)
            {
                this.updateBlockListPrivate(this.lastResult);
            }
        }); // needs to do -1 if the button is clicked already
    }

    private getTitle() {

        if (this.state.displayMode == "priority_fee") {
            return "Priority fee live";
        }
        if (this.state.displayMode == "base_fee") {
            return "Base fee live";
        }
        if (this.state.displayMode == "total_fee") {
            return "Total fee live";
        }
    }

    render() {
        return (
            <Flex flex={1} flexDirection="column">
                <Flex flexDirection="row">
                    <h1> {this.getTitle()}</h1> (Timer: {this.formatTime(this.state.seconds)})
                </Flex>
                <Flex flexDirection="row">
                    <Button onClick={this.handleClick.bind(this, "priority_fee")}>Priority fee</Button>
                    <Button onClick={this.handleClick.bind(this, "base_fee")}>Base fee</Button>
                    <Button onClick={this.handleClick.bind(this, "total_fee")}>Total fee</Button>
                    <Button onClick={this.handleClick2.bind(this, 20)}>20</Button>
                    <Button onClick={this.handleClick2.bind(this, 50)}>50</Button>
                    <Button onClick={this.handleClick2.bind(this, 100)}>100</Button>
                </Flex>
                <Flex>
                    <Bar options={{animation: {
                            duration: 0
                        }}} data={this.state.chartData}/>
                </Flex>
            </Flex>

        );
    }
}