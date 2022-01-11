import React from 'react';
import {GasChart} from "./components/GasChart";
import "./App.css";
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
import {BlockListComponent} from "./components/BlockList";
import {BlockListProvider} from "./provider/BlockListProvider";

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

const defaultData =
  [
    {"blockNo":23568293,"minGas":30,"gasUsed":13394423,"gasLimit":15384954,"transCount":60,"blockTime":"2022-01-10T20:09:44.000Z","blockVer":2,"_id":"61dd8b79ea4d960fb7fb4d35"},
    {"blockNo":23568292,"minGas":30.1,"gasUsed":11161378,"gasLimit":15399992,"transCount":79,"blockTime":"2022-01-10T20:09:42.000Z","blockVer":2,"_id":"61dd8b78ea4d960fb7fb4d34"},
    {"blockNo":23568291,"minGas":30,"gasUsed":11587819,"gasLimit":15415044,"transCount":121,"blockTime":"2022-01-10T20:09:40.000Z","blockVer":2,"_id":"61dd8b78ea4d960fb7fb4d33"},
    {"blockNo":23568290,"minGas":30.000000001,"gasUsed":15412659,"gasLimit":15430111,"transCount":124,"blockTime":"2022-01-10T20:09:38.000Z","blockVer":2,"_id":"61dd8b78ea4d960fb7fb4d32"},
    {"blockNo":23568289,"minGas":30.1,"gasUsed":15413163,"gasLimit":15445193,"transCount":175,"blockTime":"2022-01-10T20:09:36.000Z","blockVer":2,"_id":"61dd8b77ea4d960fb7fb4d31"},
    {"blockNo":23568288,"minGas":30,"gasUsed":10033566,"gasLimit":15460289,"transCount":63,"blockTime":"2022-01-10T20:09:34.000Z","blockVer":2,"_id":"61dd8b77ea4d960fb7fb4d30"},
    {"blockNo":23568287,"minGas":30,"gasUsed":10190587,"gasLimit":15475400,"transCount":56,"blockTime":"2022-01-10T20:09:32.000Z","blockVer":2,"_id":"61dd8b76ea4d960fb7fb4d2f"},
    {"blockNo":23568286,"minGas":30,"gasUsed":13958375,"gasLimit":15490526,"transCount":88,"blockTime":"2022-01-10T20:09:30.000Z","blockVer":2,"_id":"61dd8b76ea4d960fb7fb4d2e"},
    {"blockNo":23568285,"minGas":30,"gasUsed":10811569,"gasLimit":15505667,"transCount":56,"blockTime":"2022-01-10T20:09:28.000Z","blockVer":2,"_id":"61dd8b75ea4d960fb7fb4d2d"},
    {"blockNo":23568284,"minGas":30,"gasUsed":8485065,"gasLimit":15520823,"transCount":51,"blockTime":"2022-01-10T20:09:26.000Z","blockVer":2,"_id":"61dd8b75ea4d960fb7fb4d2c"}
  ];

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      seconds: parseInt(props.startTimeInSeconds, 10) || 0,
      blockListProvider: new BlockListProvider()
    };
  }


  componentDidMount() {
   // this.interval = setInterval(async () => await this.tick(), 2000);
  }

  componentWillUnmount() {
    //clearInterval(this.interval);
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
        <div className="background">
          <a href="http://localhost:7888/polygon/gas-info/waiting_times?block_start=23500795&block_count=1000000">API</a>
          <div className="title">
            <div>PolygonGas</div>
          </div>
          <div className="page-content">
            <div className="current-gas-chart">
              <GasChart></GasChart>
            </div>
            <div className="block-list-component">
              <BlockListComponent></BlockListComponent>
            </div>
          </div>
        </div>

    );
  }
}
/*
export function App() {
  useEffect(() => {
    const fetchPrices
  }, []);
  const [chartData, setChartData] = useState(data);

  return <Bar options={options} data={chartData} />;
}*/
