import React from 'react';
import {Bar} from "react-chartjs-2";
// @ts-ignore
import blockListProvider, {BlockListProviderResult} from "../provider/BlockListProvider";
import {Flex, Text, Table, Thead, Tbody, Tr, Th, Td} from "@chakra-ui/react";

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
      <Flex direction="column" backgroundColor="white" padding="10px">
        <Flex>
          <h2>Latest blocks</h2>
        </Flex>
        <Flex>
          {this.state.error !== "" &&
              <Text>{this.state.error}</Text>
          }
          {this.state.error === "" &&
              <Table>
                <Thead>
                <Tr>
                  <Th>Block <br/>number</Th>
                  <Th>Minimum gas<br/> in block</Th>
                  <Th>% of gas<br/> used</Th>
                  <Th>Block<br/> date</Th>
                </Tr>

                </Thead>
                <Tbody>
                {this.state.blockData.map(blockData => (
                    <Tr key={blockData.blockNo}>
                      <Td><a href={"https://polygonscan.com/block/" + blockData.blockNo}>{blockData.blockNo}</a></Td>
                      <Td>{blockData.minGas.toFixed(2)}</Td>
                      <Td>{(blockData.gasUsed / blockData.gasLimit).toFixed(3)}</Td>
                      <Td>{blockData.blockTime}</Td>
                    </Tr>))}
                </Tbody>
              </Table>
          }
        </Flex>
      </Flex>
    );
  }
}

