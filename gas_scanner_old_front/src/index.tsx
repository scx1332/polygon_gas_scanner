import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {App} from './App';
import {ChakraProvider} from "@chakra-ui/react"
import { BrowserRouter, Routes, Route } from "react-router-dom";

//very important:

/*
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}
*/
ReactDOM.render(
   <ChakraProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App page="main" />} />
        <Route path="/about" element={<App page="about" />} />
      </Routes>
    </BrowserRouter>
  </ChakraProvider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
