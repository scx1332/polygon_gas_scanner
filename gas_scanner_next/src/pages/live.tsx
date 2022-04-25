import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Layout from '../src/components/layout'
import {Flex} from "@chakra-ui/react";


const Live: NextPage = () => {
    return (
        <Layout>
            <Flex direction="column">
                Live view
            </Flex>
        </Layout>
    )
}

export default Live
