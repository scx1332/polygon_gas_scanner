import React from 'react';
import dynamic from 'next/dynamic';
//@ts-ignore
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
//import Plot from 'react-plotly.js';

import Layout from './common/Layout'
import {Flex} from "@chakra-ui/react";

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

const Plotlychart = () => {
    return (
        <Layout>
            <Flex direction="column">
                <Plot

                    data={plot_data}
                    layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
                />

            </Flex>
        </Layout>
    )
}

export default Plotlychart

