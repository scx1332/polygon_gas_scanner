import React from 'react';
import "./BlockList.css";
import {Bar} from "react-chartjs-2";
import blockListProvider from "../provider/BlockListProvider";



export class BlockListComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      seconds: 0,
      blockData: []
    };
  }

  //listener
  updateBlockData(blockData) {
    this.setState({blockData: blockData});
    console.log("Update block data: " + blockData);
  }
/*
  async fetchLastBlocks() {
    const res = await fetch("http://localhost:7888/polygon/block-info/last-blocks?block_count=10");
    //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
    let json_result = await res.json();

    console.log(json_result);
    return json_result;
  }


  async tick() {
    let blockData = await this.fetchLastBlocks();
    console.log(blockData);
    this.setState(state => ({
      seconds: state.seconds + 2,
      blockData: blockData
    }));
  }
*/
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
          <h2>Latest blocks</h2>
        </div>
        <div>
          <table>
            <thead>
              <tr>
                <th>Block <br/>number</th>
                <th>Minimum gas<br/> in block</th>
                <th>% of gas<br/> used</th>
                <th>Block<br/> date</th>
              </tr>

            </thead>
            <tbody>
              {this.state.blockData.map(blockData => (
                <tr key={blockData.blockNo}>
                  <td><a href={"https://polygonscan.com/block/" + blockData.blockNo}>{blockData.blockNo}</a></td>
                  <td>{blockData.minGas.toFixed(2)}</td>
                  <td>{(blockData.gasUsed / blockData.gasLimit).toFixed(3)}</td>
                  <td>{blockData.blockTime}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

    );
  }
}

