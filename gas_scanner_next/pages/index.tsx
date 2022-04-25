import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Layout from '../components/layout'
import {Flex} from "@chakra-ui/react";


const Home: NextPage = () => {
  return (
      <Layout>
          <Flex direction="column" shrink="0">
              <Flex direction="row" flex={1} shrink="0" alignItems="stretch" justifyContent="space-between"
                    gridGap="5">
                  dupa
              </Flex>
              <Flex direction="row" flex={1} shrink="0" alignItems="stretch" justifyContent="space-between" gridGap="5">

              </Flex>
              <Flex direction="row" flex={1} shrink="0" alignItems="stretch" justifyContent="space-between" gridGap="5">

              </Flex>
              <Flex direction="row" flex={1} shrink="0" alignItems="stretch" justifyContent="space-between" gridGap="5">

              </Flex>

              <Flex direction="row" flex={1} shrink="0" alignItems="stretch" justifyContent="space-between" gridGap="5">

              </Flex>
          </Flex>
          <Flex direction="column" shrink="0">
              About
          </Flex>


      </Layout>
  )
}

export default Home
