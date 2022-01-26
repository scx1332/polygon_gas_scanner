import React from 'react';
import {Bar} from "react-chartjs-2";
// @ts-ignore
import blockListProvider, {BlockListProviderResult} from "../provider/BlockListProvider";
import {Flex, Text, Table, Thead, Tbody, Tr, Th, Td} from "@chakra-ui/react";
import selectedAddressStore, {SelectedAddressStoreState} from "../store/SelectedAddressStore";

class TransactionEntry {
  txid: string = "";
  blockNo: number = 0;
  gasPrice: string = "";
  gaUsed: string = "";
  from: string = ""
  to: string = ""
  nonce: number = 0;
  datetime: string = "";
  erc20from: string = "";
  erc20to: string = "";
  erc20amount: string = "";
  version: string = "";
}

class IProps {

}
class TransactionListComponentState {
  transactionData = new Array<TransactionEntry>();
  selectedAddress? : string;
  error = "";
}

export class TransactionListComponent extends React.Component<IProps, TransactionListComponentState> {
  constructor(props:any) {
    super(props);
    this.state = {
      transactionData: new Array<TransactionEntry>(),
      selectedAddress: undefined,
      error: ""
    };
  }

  async fetchTransactionList() {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    if (this.state.selectedAddress) {
      const res = await fetch(`${BACKEND_URL}/polygon/transactions/all?address=${this.state.selectedAddress}`);

      //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
      let json_result = await res.json();

      console.log(json_result);
      this.setState({transactionData: json_result});
    }
  }


  selectedAddressChanged(newState : SelectedAddressStoreState) {
    this.setState({selectedAddress: newState.selectedAddress}, async () => await this.fetchTransactionList());
  }

  componentDidMount() {
    setTimeout(async() => await this.fetchTransactionList(), 1000);

    selectedAddressStore.attach(this);

    //blockListProvider.attach(this);
  }

  componentWillUnmount() {
    //blockListProvider.detach(this);
    selectedAddressStore.detach(this);
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
                {this.state.transactionData.map(transactionData => (
                    <Tr>
                      <Td><a href={"https://polygonscan.com/tx/" + transactionData.txid}>{transactionData.txid}</a></Td>
                      <Td>{transactionData.datetime}</Td>
                      <Td>{transactionData.erc20amount}</Td>
                      <Td>{transactionData.gasPrice}</Td>
                      <Td>{transactionData.erc20to}</Td>
                      <Td>{transactionData.nonce}</Td>
                    </Tr>))}
                </Tbody>
              </Table>
          }
        </Flex>
      </Flex>
    );
  }
}

