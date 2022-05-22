import type { NextPage } from 'next'
import Layout from './common/Layout'
import {Flex} from "@chakra-ui/react";
import GasChart from "../charts/GasChart";


const Home: NextPage = () => {
  return (
      <Layout>
          <Flex direction="column">
              Live view
              <GasChart></GasChart>
          </Flex>
      </Layout>
  )
}

export default Home
