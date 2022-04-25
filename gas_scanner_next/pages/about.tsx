import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Layout from '../components/layout'
import {Flex} from "@chakra-ui/react";


const About: NextPage = () => {
    return (
        <Layout>
            <Flex direction="column" shrink="0">
                About
            </Flex>
        </Layout>
    )
}

export default About
