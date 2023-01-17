import React, {useEffect, useState} from 'react';
import dynamic from 'next/dynamic';

import Layout from './common/Layout';
import {Button, Flex} from "@chakra-ui/react";

//@ts-ignore
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
//import Plot from 'react-plotly.js';


// @ts-ignore
const plot_data = [
        {
         x: [1, 2, 3],
            y: [2, 6, 3],
            type: 'scatter',
            mode: 'lines+markers',
            marker: {color: 'red'},
        },
{type: 'bar', x: [1, 2, 3], y: [2, 5, 3]}
];

function generateDurations() {
    const currentDate = new Date();

    const currentYear = currentDate.getUTCFullYear();
    const currentMonth = currentDate.getUTCMonth();

    let years = [];
    for (let year = 2020; year <= currentYear; year++) {
        let durations = [];
        let month_limit = 12;
        if (year == currentYear) {
            month_limit = currentMonth;
        }
        for (let i = 0; i < month_limit; i++ ) {
            let month_no = i + 1;
            durations.push(
                {
                    name: `Month ${month_no}`,
                    no: month_no
                }
            )
        }
        years.push({
            name: year,
            durations: durations
        });
    }
    return years;

}
const durations = [
    {
        no: 1,
        name: "january",
    },
    {
        no: 2,
        name: "february"
    },
];

const plot_data2 = [
    {
        x: [1, 2, 3, 5],
        y: [2, 6, 3, 6],
        type: 'scatter',
        mode: 'lines+markers',
        marker: {color: 'red'},
    }
];

const Plotlychart = () => {
    const [plotData, setPlotData] = useState(plot_data);
    const [count, setCount] = useState(0);

    function button_click() {
        fetchMyAPI();
    }
    async function fetchMyAPI() {
        let lastBLocks = 1000;
        const BACKEND_URL = "http://145.239.69.80:8899";
        //const res = await fetch(`${BACKEND_URL}/polygon/block-info/last-blocks?block_count=${lastBLocks}`);
        let timespan_seconds = 3600;
        const res = await fetch(`${BACKEND_URL}/polygon/block-info/last-time-frames?block_count=${lastBLocks}&&timespan_seconds=${timespan_seconds}`);
        let json_result = await res.json();
        //console.log(json_result);

        let xarray = [];
        let yarray = [];
        for (var i = 0; i < json_result.length; i++){
            let obj = json_result[i];
            //xarray.push(obj["blockTime"]);
            xarray.push(obj["timeFrameStart"]);
            //yarray.push(obj["baseFeePrice"]);
            yarray.push(obj["totalFees"] - 0.0);
        }
        const plot_data2 = [
            {
                x: xarray,
                y: yarray,
                type: 'bar',
                //mode: 'lines+markers',
                marker: {color: 'blue'},
            }/*,
                {type: 'bar', x: xarray, y: yarray}*/
        ];
        setPlotData(plot_data2);
    }

    useEffect(() => {
        //if (count == 0) {
            //fetchMyAPI();
            //setCount(1);
        //}
    });

    return (
        <Layout>
            <Flex direction="column">
                <Flex direction="row">
                    <Button onClick={button_click}>Load data</Button>
                    <Button>test</Button>
                </Flex>
                <Flex direction="row" backgroundColor={"black"}>
                    <Flex direction="row">
                        {generateDurations().map((year) => {
                            let months = year.durations.map((duration) => {
                                    console.log("Entered");
                                    // Return the element. Also pass key
                                    return (<Button key={duration.no}>{duration.name}</Button>)
                                });
                            return (<Flex direction="column"><Button key={year.name}>{year.name}</Button>
                                  {months}</Flex>);
                            })
                        }
                    </Flex>
                    <Button onClick={button_click}>Load data</Button>
                    <Button>test</Button>
                </Flex>
                {/*<Plot
                    data={plotData}
                    layout={ {height: 600, title: 'Minimum gas prices in minute interval'} }
                />*/}

            </Flex>
        </Layout>
    )
}

export default Plotlychart

