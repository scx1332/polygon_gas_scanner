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

    private getActiveColor() {
        return "#FEA443";
    }
    private getPassiveColor() {
        return "#705E78";
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

        this.setState(new GasChartState(0, {labels: labels, datasets: datasets}, this.state.displayMode, this.state.numberOnChart));
        //console.log("Update block data: " + blockData);
    }

    public componentDidMount() {
        blockListProvider.attach(this);
    }

    public componentWillUnmount() {
        blockListProvider.detach(this);
    }

    private displayModeChanged(displayMode:string) {
        this.setState(new GasChartState(this.state.seconds, this.state.chartData, displayMode, this.state.numberOnChart), () => {
            if (this.lastResult)
            {
                this.updateBlockListPrivate(this.lastResult);
            }
            }); // needs to do -1 if the button is clicked already
        }
    private displayCountChanged(number_str:string) {
        let number = parseInt(number_str);
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
                    <Flex flexDirection="row">
                        <Heading textColor={this.getPassiveColor()} as='h3' size='md'> {this.getTitle()}</Heading>
                    </Flex>
                    <Spacer />
                    {this.getLegend()}

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