import {useEffect, useState} from "react";
import {promisify} from "util";

async function fetchData() {

}

//@ts-ignore
const sleep = m => new Promise(r => setTimeout(r, m));

export function ClientSideObject() {
    //const [data, setData] = useState(null)
    //const [isLoading, setLoading] = useState(false)
    const [counter, setCounter] = useState(0)

    useEffect( () => {
        async function incrementCounter() {
            await sleep(1000);
            setCounter(counter + 1);
        }
        incrementCounter().catch(console.error);
    }, [counter])

    //if (isLoading) return <p>Loading...</p>
    //if (!data) return <p>No profile data</p>

    return (
        <div>
            <h1>Count</h1>
            <p>{counter}</p>
        </div>
    )
}