import {Button, Flex, Heading, Link} from "@chakra-ui/react";

export default function Navbar() {
    return (
        <>
            <Flex height="100px;" padding="10px">
                <Flex align="center">
                    <Heading>PolygonGas</Heading>
                </Flex>
                <Flex align="center">

                    <a href="http://localhost:7888/polygon/gas-info/waiting_times?block_start=23500795&block_count=1000000">API</a>
                </Flex>
                <Flex align="center" padding="0 20px" gridGap="3">
                    <Button>Main</Button>
                    <Button>About</Button>
                </Flex>

                <Flex align="center" direction="column" padding="20px">
                    <Flex>Sponsored by: </Flex>
                    <Flex><Link href="https://golem.network">golem.network</Link></Flex>
                </Flex>

            </Flex>
        </>
    )
}