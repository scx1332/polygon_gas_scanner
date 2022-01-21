import React from 'react';
import {Bar} from "react-chartjs-2";
// @ts-ignore
import blockListProvider, {BlockListProviderResult} from "../provider/BlockListProvider";
import {Flex, Text, Table, Thead, Tbody, Tr, Th, Td} from "@chakra-ui/react";

class AddressEntry {
  address: string = "";
}

class AddressListComponentState {
  addressData = new Array<AddressEntry>();
  error = "";
}

export class AddressListComponent extends React.Component {
  state: AddressListComponentState;

  constructor(props:any) {
    super(props);
    this.state = {
      addressData: new Array<AddressEntry>(),
      error: ""
    };
  }

  //listener
  updateBlockList(blockListProviderResult: BlockListProviderResult) {
    this.setState({ blockData: blockListProviderResult.blockData, error: blockListProviderResult.error });
    console.log("Update block data: " + blockListProviderResult.blockData);
  }

  async fetchAddressList() {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const res = await fetch(`${BACKEND_URL}/polygon/monitored-addresses/all`);

    //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
    let json_result = await res.json();



    console.log(json_result);
    this.setState({addressData: json_result});
  }
/*
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
    setTimeout(async() => await this.fetchAddressList(), 1000);

    //blockListProvider.attach(this);
  }

  componentWillUnmount() {
    //blockListProvider.detach(this);
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
                  <Th>Address list</Th>
                </Tr>

                </Thead>
                <Tbody>
                {this.state.addressData.map(addressData => (
                    <Tr>
                      <Td><a href={"https://polygonscan.com/address/" + addressData.address}>{addressData.address}</a></Td>
                    </Tr>))}
                </Tbody>
              </Table>
          }
        </Flex>
      </Flex>
    );
  }
}

