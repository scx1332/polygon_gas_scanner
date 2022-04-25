import Navbar from './Navbar'
import Footer from './Footer'
import {Box, Button, Flex, Heading, Link} from "@chakra-ui/react";
import SmallWithLogoLeft from "./Footer";
import Nav from './Navbar2'

// @ts-ignore
export default function Layout({ children }) {
    return (
        <Flex direction="column" padding="0px 20px" height="100%">
            <Nav></Nav>
            <main>
                {children}
            </main>

            <SmallWithLogoLeft></SmallWithLogoLeft>
        </Flex>
    )
}