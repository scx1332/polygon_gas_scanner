import React from 'react';
import {Bar} from "react-chartjs-2";
// @ts-ignore
import blockListProvider, {BlockListProviderResult} from "../provider/BlockListProvider";
import {Flex, Text, Table, Thead, Tbody, Tr, Th, Td, Button} from "@chakra-ui/react";
import selectedAddressStore, {SelectedAddressStoreState} from "../store/SelectedAddressStore";

class AddressEntry {
  address: string = "";
}

interface IProps {

}
class AddressListComponentState {
  addressData = new Array<AddressEntry>();
  selectedAddress? : string;
  error = "";
}

export class AddressListComponent extends React.Component<IProps, AddressListComponentState>  {

  constructor(props:IProps) {
    super(props);
    this.state = {
      addressData: new Array<AddressEntry>(),
      selectedAddress: undefined,
      error: ""
    };
  }


  async fetchAddressList() {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const res = await fetch(`${BACKEND_URL}/polygon/monitored-addresses/all`);

    //const res = await fetch("http://127.0.0.1:7888/polygon/gas-info/hist10");
    let json_result = await res.json();

    console.log(json_result);
    this.setState({addressData: json_result});
  }

  selectedAddressChanged(newState : SelectedAddressStoreState) {
    this.setState({selectedAddress: newState.selectedAddress})
  }

  componentDidMount() {
    setTimeout(async() => await this.fetchAddressList(), 1000);

    selectedAddressStore.attach(this);
  }

  componentWillUnmount() {
    selectedAddressStore.detach(this);
  }

  selectAddressClick(address: string) {
    selectedAddressStore.setSelectedAddress(address);
  }

  render() {
    return (
      <Flex direction="column" backgroundColor="white" padding="10px">
        <Flex>
          <h2>Latest blocks</h2>
          {this.state.selectedAddress}
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
                      <Td><Button onClick={this.selectAddressClick.bind(this, addressData.address)}>{addressData.address}</Button></Td>
                      <Td><a href={"https://polygonscan.com/address/" + addressData.address}>Polygon</a></Td>
                    </Tr>))}
                </Tbody>
              </Table>
          }
        </Flex>
      </Flex>
    );
  }
}

