import { delay } from '@azure/service-bus';
import { BusClient } from './index'

let busClient: BusClient = new BusClient("<connect-string>");

async function main() {
    var testNumber: number = 1;
    while(true)
    {
        await delay(3000);
        console.log(`send${testNumber}`)
        busClient.sendMessage("aa", {body: `test${testNumber}`})
        testNumber += 1;
        
    }
}

main().catch((err) => {
    console.log(err);
})