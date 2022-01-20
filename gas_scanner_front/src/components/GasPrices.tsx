import React from "react";
import blockListProvider from "../provider/BlockListProvider";
import suggestedGasProvider, {SuggestedGasResult} from "../provider/SuggestedGasProvider";
import {Flex, Heading, Text} from "@chakra-ui/react";


export class GasPricesProps {

}

class GasPricesState {
    suggestedGasResult: SuggestedGasResult | undefined;

}

export class SuggestedGasComponent extends React.Component<GasPricesProps, GasPricesState> {

    constructor(props: GasPricesProps) {
        super(props);
        this.state = new GasPricesState()
    }

    componentDidMount() {
        suggestedGasProvider.attach(this);
    }

    componentWillUnmount() {
        suggestedGasProvider.detach(this);
    }

    updateSuggestedGasResult(suggestedGasResult : SuggestedGasResult) {
        console.log(JSON.stringify(suggestedGasResult));
        this.setState({suggestedGasResult: suggestedGasResult});
    }


    private getTitle() {
        return "Suggested transaction fees";
    }

    private getActiveColor() {
        return "#FEA443";
    }
    private getPassiveColor() {
        return "#705E78";
    }
    render() {
        return (
            <Flex  direction="column" gridGap="2" padding="10px" backgroundColor="white" margin="10px 0px">
                <Heading textColor={this.getPassiveColor()} as='h3' size='md'> {this.getTitle()}</Heading>

                <Flex direction="row" gridGap="2" >
                    <Flex direction="column" border="1px solid black" borderRadius="5" padding="1" backgroundColor="#BCFAB4">
                        <Flex selfAlign="center">
                            <Heading as='h3' size='sm' fontWeight="Normal">Eco</Heading>
                        </Flex>
                        <Flex selfAlign="center">
                            <Text fontSize="20px" fontWeight="Bold">{this.state.suggestedGasResult?.gasEntry?.minGasPrice1000} Gwei</Text>
                        </Flex>
                        <Flex selfAlign="center">
                            (Half an hour)
                        </Flex>
                    </Flex>
                    <Flex direction="column" border="1px solid black" borderRadius="5" padding="1" backgroundColor="#E3D098">
                        <Flex selfAlign="center">
                            <Heading as='h3' size='sm' fontWeight="Normal">Standard</Heading>
                        </Flex>
                        <Flex selfAlign="center">
                            <Text fontSize="20px" fontWeight="Bold">{this.state.suggestedGasResult?.gasEntry?.optimalGasPrice} Gwei</Text>
                        </Flex>
                        <Flex>
                            (1 Minute)
                        </Flex>
                    </Flex>
                    <Flex direction="column" border="1px solid black" borderRadius="5" padding="1" backgroundColor="#E3B0FF">
                        <Flex selfAlign="center">
                            <Heading as='h3' size='sm' fontWeight="Normal">Fast</Heading>
                        </Flex>
                        <Flex selfAlign="center">
                            <Text fontSize="20px" fontWeight="Bold">{this.state.suggestedGasResult?.gasEntry?.maxMinGasPrice100} Gwei</Text>
                        </Flex>
                        <Flex>
                            (instant)
                        </Flex>
                    </Flex>
                    <Flex direction="column" border="1px solid black" borderRadius="5" padding="1" backgroundColor="#FFB3AB">
                        <Flex selfAlign="center">
                            <Heading as='h3' size='sm' fontWeight="Normal">Express</Heading>
                        </Flex>
                        <Flex selfAlign="center">
                            <Text fontSize="20px" fontWeight="Bold">{this.state.suggestedGasResult?.gasEntry?.maxMinGasPrice1000} Gwei</Text>
                        </Flex>
                        <Flex>
                            (instant)
                        </Flex>
                    </Flex>


                </Flex>
            </Flex>
        );
    }
}