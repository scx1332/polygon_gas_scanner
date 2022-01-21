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
import {
    Flex,
    Spacer,
    Button,
    ButtonGroup,
    Heading,
    Radio,
    RadioGroup,
    Accordion,
    AccordionButton,
    AccordionPanel,
    Box,
    AccordionIcon,
    AccordionItem,
    Text
} from "@chakra-ui/react";
import timeFrameProvider, {TimeFrameProviderResult} from "../provider/TimeFrameProvider";
import moment from "moment";
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
    chartMode: string;

    constructor(seconds: number, chartData: any, displayMode: string, numberOnChart: number, chartMode: string) {
        this.seconds = seconds;
        this.chartData = chartData;
        this.displayMode = displayMode;
        this.numberOnChart = numberOnChart;
        this.chartMode = chartMode;
    }
}


export class GasChart extends React.Component {
    state : GasChartState;

    lastResult : BlockListProviderResult | undefined;
    lastTimeFrameResult: TimeFrameProviderResult | undefined;

    constructor(props : any) {
        super(props);
        this.state = new GasChartState(0, defaultData, "total_fee", 50, "block_1");
    }
    isChartLive() {
        return this.state.chartMode == "block_1";
    }
    isChartAverage() {
        return this.state.chartMode == "minute_1" || this.state.chartMode == "hour_1";
    }


    updateBlockList(blockListProviderResult: BlockListProviderResult) {
        this.lastResult = blockListProviderResult;
        if (this.isChartLive()) {
            this.updateBlockListPrivate(this.lastResult);
        }
    }

    private getActiveColor() {
        return "#FEA443";
    }
    private getPassiveColor() {
        return "#705E78";
    }

    private updateChartPrivate() {
        if (this.isChartLive() && this.lastResult) {
            this.updateBlockListPrivate(this.lastResult);
        }
        else if (this.isChartAverage() && this.lastTimeFrameResult) {
            this.updateTimeFrameDataPrivate(this.lastTimeFrameResult);
        }
    }

    //#F3FEB0
    //#FEA443
    //#705E78
    //#A5AAA3
    //#812F33
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
                backgroundColors.push(this.getPassiveColor());
            } else {
                backgroundColors.push(this.getActiveColor());
            }
        }
        let datasets = [
            {
                data: minGasArray,
                backgroundColor: backgroundColors
            }

        ];

        this.setState({chartData: {labels: labels, datasets: datasets}});
        //console.log("Update block data: " + blockData);
    }
    updateTimeFrameData(timeFrameDataResult : TimeFrameProviderResult) {
        this.lastTimeFrameResult = timeFrameDataResult;

        if (this.isChartAverage()) {
            this.updateTimeFrameDataPrivate(timeFrameDataResult);
        }
    }

    updateTimeFrameDataPrivate(timeFrameDataResult : TimeFrameProviderResult) {
        let labels = [];
        let minGasArray = [];
        let backgroundColors = new Array<string>();
        let timeFrameData = timeFrameDataResult.timeFrameData60;
        if (this.state.chartMode == "hour_1") {
            timeFrameData = timeFrameDataResult.timeFrameData3600;
        }

        let aggregateCount = 0;
        let minimumGas = 0;
        for (let blockDataIdx = Math.max(0, timeFrameData.length - this.state.numberOnChart); blockDataIdx < timeFrameData.length; blockDataIdx += 1) {
            let blockEntry = timeFrameData[blockDataIdx];

            let dt = new Date(blockEntry.timeFrameStart);
            if (dt.getHours() == 0 && dt.getMinutes() == 0) {
                labels.push(moment(dt).format("MMM-DD HH:mm"));
            } else {
                labels.push(moment(dt).format("HH:mm"));
            }
            minGasArray.push(blockEntry.minGas);
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
        console.log("Setting state");

        this.setState({chartData: {labels: labels, datasets: datasets}});
    }

    public componentDidMount() {
        blockListProvider.attach(this);
        timeFrameProvider.attach(this);
    }

    public componentWillUnmount() {
        blockListProvider.detach(this);
        timeFrameProvider.detach(this);
    }

    private binCapacityChanged(binCapacity:string) {
        this.setState({chartMode: binCapacity}, () => {
            this.updateChartPrivate();
        }); // );
    }

    private displayModeChanged(displayMode:string) {
        this.setState({displayMode: displayMode}, () => {
            this.updateChartPrivate();
            }); // needs to do -1 if the button is clicked already
        }
    private displayCountChanged(number_str:string) {
        let number = parseInt(number_str);
        this.setState({numberOnChart: number}, () => {
            this.updateChartPrivate();
        }); // needs to do -1 if the button is clicked already
    }

    private getTitle() {
        if (this.isChartAverage()) {
            return "Aggregated data";
        }

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

    getLegend() {
        return (
            <Flex flexDirection="column" gridGap="0">
                <Flex flexDirection="row" gridGap="2">
                    <Flex alignSelf="center" backgroundColor={this.getActiveColor()} width="20px" height="10px"></Flex>
                    <Text fontSize="12px" alignSelf="center">Gas usage over 50%</Text>
                </Flex>
                <Flex flexDirection="row" gridGap="2">
                    <Flex alignSelf="center" backgroundColor={this.getPassiveColor()} width="20px" height="10px"></Flex>
                    <Text fontSize="12px" alignSelf="center">Gas usage under 50%</Text>
                </Flex>
            </Flex>
        );
    }

    render() {
        return (
            <Flex flex={1} flexDirection="column" gridGap="3" backgroundColor={"white"} padding={"15px"}>
                <Flex flexDirection="row"  gridGap="3">
                    <Flex flexDirection="column">
                        <Heading textColor={this.getPassiveColor()} as='h3' size='md'> {this.getTitle()}</Heading>
                        {this.getLegend()}
                    </Flex>
                    <Spacer />

                    <Accordion allowToggle={true}>
                        <AccordionItem>
                            <AccordionButton>
                                Bin size
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                <RadioGroup onChange={this.binCapacityChanged.bind(this)} value={this.state.chartMode}>
                                    <Flex flexDirection="column"  gridGap="1">
                                        <Radio value="block_1">1 Block</Radio>
                                        <Radio value="minute_1">1 Minute</Radio>
                                        <Radio value="hour_1">1 Hour</Radio>
                                    </Flex>
                                </RadioGroup>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                    <Accordion allowToggle={true}>
                        <AccordionItem>
                            <AccordionButton>
                                Fee type
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                <RadioGroup onChange={this.displayModeChanged.bind(this)} value={this.state.displayMode}>
                                    <Flex flexDirection="column"  gridGap="1">
                                        <Radio value="priority_fee">Priority fee</Radio>
                                        <Radio value="base_fee">Base fee</Radio>
                                        <Radio value="total_fee">Total fee</Radio>
                                    </Flex>
                                </RadioGroup>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                    <Accordion allowToggle={true}>
                        <AccordionItem>
                            <AccordionButton>
                                Capacity
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                <RadioGroup onChange={this.displayCountChanged.bind(this)} value={this.state.numberOnChart.toString()}>
                                    <Flex flexDirection="column"  gridGap="1">
                                        <Radio value="20">20</Radio>
                                        <Radio value="50">50</Radio>
                                        <Radio value="100">100</Radio>
                                    </Flex>
                                </RadioGroup>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </Flex>
                <Flex>
                    <Bar options={{

                        animation: {
                            duration: 0

                        },

                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }} data={this.state.chartData}/>
                </Flex>
            </Flex>

        );
    }
}