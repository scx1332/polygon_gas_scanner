import React, {useEffect, useState} from 'react';
import dynamic from 'next/dynamic';

import Layout from './common/Layout';
import {Flex} from "@chakra-ui/react";

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

    useEffect(() => {
        async function fetchMyAPI() {
            let lastBLocks = 10000;
            const BACKEND_URL = "http://145.239.69.80:8899";
            //const res = await fetch(`${BACKEND_URL}/polygon/block-info/last-blocks?block_count=${lastBLocks}`);
            let timespan_seconds = 60;
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
                yarray.push(obj["minGas"] - 0.0);
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

        if (count == 0) {
            fetchMyAPI();
            setCount(1);

        }

    });

    return (
        <Layout>
            <Flex direction="column">
                <Plot

                    data={plotData}
                    layout={ {height: 600, title: 'Minimum gas prices in minute interval'} }
                />

            </Flex>
        </Layout>
    )
}

export default Plotlychart

