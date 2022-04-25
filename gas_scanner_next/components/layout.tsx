import Navbar from './navbar'
import Footer from './footer'
import {Box, Button, Flex, Heading, Link} from "@chakra-ui/react";
import SmallWithLogoLeft from "./footer";
import Nav from './navbar2'

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