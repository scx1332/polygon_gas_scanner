import React from 'react';
import "./BlockList.css";
import {Bar} from "react-chartjs-2";
// @ts-ignore
import blockListProvider, {BlockListProviderResult} from "../provider/BlockListProvider";


class BlockDataEntry {
  blockNo: number = 0;
  minGas: number = 0;
  gasUsed: number = 0;
  gasLimit: number = 0;
  blockTime: string = "";
}

class BlockListComponentState {
  blockData = new Array<BlockDataEntry>();
  error = "";
}

export class BlockListComponent extends React.Component {
  state: BlockListComponentState;

  constructor(props:any) {
    super(props);
    this.state = {
      blockData: new Array<BlockDataEntry>(),
      error: ""
    };
  }

  //listener
  updateBlockList(blockListProviderResult: BlockListProviderResult) {
    this.setState({ blockData: blockListProviderResult.blockData, error: blockListProviderResult.error });
    console.log("Update block data: " + blockListProviderResult.blockData);
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

  render() {
    return (
      <div>
        <div>
          <h2>Latest blocks</h2>
        </div>
        <div>
          {this.state.error !== "" &&
              <div>{this.state.error}</div>
          }
          {this.state.error === "" &&
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
          }
        </div>
      </div>

    );
  }
}

