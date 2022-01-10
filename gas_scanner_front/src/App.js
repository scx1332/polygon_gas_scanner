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

export class App extends React.Component {
  constructor(props) {
    super(props);
  }

  /*
  async tick() {
    let chartData = await this.fetchPrices();
    console.log(chartData);
    this.setState(state => ({
      seconds: state.seconds + 2,
      chartData: chartData
    }));
  }*/

  componentDidMount() {
//    this.interval = setInterval(async () => await this.tick(), 2000);
  }

  componentWillUnmount() {
  //  clearInterval(this.interval);
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
          <div className="title">
            <div>PolygonGas</div>
          </div>
          <div className="current-gas-chart">
            <GasChart></GasChart>
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
