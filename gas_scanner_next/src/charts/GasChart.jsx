import {NextPage} from "next";
import Layout from "../pages/common/Layout";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Flex,
    Heading, Radio, RadioGroup,
    Spacer, Text
} from "@chakra-ui/react";
import {Bar} from "react-chartjs-2";
import React, {useEffect, useState} from "react";
import blockListProvider from "../providers/BlockListProvider";
import timeFrameProvider from "../providers/TimeFrameProvider";


function getActiveColor() {
    return "#FEA443";
}
function getPassiveColor() {
    return "#705E78";
}

const GasChart = () => {

    const [chartData, setChartData] = useState(null);
    const [displayMode, setDisplayMode] = useState("total_fee");
    const [chartMode, setChartMode] = useState("block_1");
    const [numberOnChart, setNumberOnChart] = useState(20);
    const [counter, setCounter] = useState(1);


    useEffect( () => {
        async function incrementCounter() {
            await sleep(1000);
            setCounter(counter + 1);
        }
        incrementCounter().catch(console.error);
    }, [counter])


    function isChartLive() {
        return chartMode == "block_1";
    }
    function isChartAverage() {
        return chartMode == "minute_1" || chartMode == "hour_1";
    }
    const handleCapacityChange = event => {
        const { name, value } = event.target;
        setInputValues({ ...inputValues, [name]: value });
    };

    const binCapacityChanged = binCapacity => {
        setChartMode(binCapacity);
    }

    const displayCountChanged = displayCountStr => {
        let displayCount = parseInt(displayCountStr);

        setNumberOnChart(displayCount);
    }
    const displayModeChanged = displayModeStr => {
        setDisplayMode(displayModeStr);
    }
    useEffect( () => {
        blockListProvider.attach(this);
        timeFrameProvider.attach(this);
    }, [counter])

    function getTitle() {
        if (isChartAverage()) {
            return "Aggregated data";
        }

        if (displayMode == "priority_fee") {
            return "Priority fee live";
        }
        if (displayMode == "base_fee") {
            return "Base fee live";
        }
        if (displayMode == "total_fee") {
            return "Total fee live";
        }
    }

    function getLegend() {
        return (
            <Flex flexDirection="column" gridGap="0">
                <Flex flexDirection="row" gridGap="2">
                    <Flex alignSelf="center" backgroundColor={getActiveColor()} width="20px" height="10px"></Flex>
                    <Text fontSize="12px" alignSelf="center">Gas usage over 50%</Text>
                </Flex>
                <Flex flexDirection="row" gridGap="2">
                    <Flex alignSelf="center" backgroundColor={getPassiveColor()} width="20px" height="10px"></Flex>
                    <Text fontSize="12px" alignSelf="center">Gas usage under 50%</Text>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex flex={1} flexDirection="column" gridGap="3" backgroundColor={"white"} padding={"15px"}>
            <Flex flexDirection="row"  gridGap="3">
                <Flex flexDirection="column">
                    <Heading textColor={getPassiveColor()} as='h3' size='md'> {getTitle()}</Heading>
                    {getLegend()}
                </Flex>
                <Spacer />


                <Accordion allowToggle={true}>
                    <AccordionItem>
                        <AccordionButton>
                            Bin size
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                            <RadioGroup onChange={binCapacityChanged} value={chartMode}>
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
                            <RadioGroup onChange={displayModeChanged} value={displayMode}>
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
                            <RadioGroup onChange={displayCountChanged} value={numberOnChart.toString()}>
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
                {/*<Bar options={{

                    animation: {
                        duration: 0

                    },

                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }} data={chartData}/>*/}
            </Flex>
        </Flex>
    )
}

export default GasChart;