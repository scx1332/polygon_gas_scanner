import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Layout from './common/Layout'
import {Flex} from "@chakra-ui/react";
import {ClientSideObject} from "../charts/ClientSideObject"

const History: NextPage = () => {
    return (
        <Layout>
            <Flex direction="column">
                <ClientSideObject></ClientSideObject>
            </Flex>
        </Layout>
    )
}

export default History
