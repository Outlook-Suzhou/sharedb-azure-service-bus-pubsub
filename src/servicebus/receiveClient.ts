import { BusClient } from './index';

const busClient: BusClient = new BusClient("<connect-string>");

async function handler(message: any) {
    console.log(message.body);
}

async function errorHandler(message: any) {
    console.log("error");
    console.log(message);
}

async function main() {
    busClient.subscribe("aa", handler, errorHandler);
}

main().catch((err) => {
    console.log(err);
})