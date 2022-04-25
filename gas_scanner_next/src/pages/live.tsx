import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Layout from './common/Layout'
import {Flex} from "@chakra-ui/react";
import {GasChart} from "../charts/GasChart";


const Live: NextPage = () => {
    return (
        <Layout>
            <Flex direction="column">
                Live view
                <GasChart></GasChart>
            </Flex>
        </Layout>
    )
}

export default Live
