import { ServiceBusClient } from "@azure/service-bus";
import {PubSub} from 'sharedb'
import * as ShareDB from 'sharedb';
import { Error } from "sharedb/lib/sharedb";
import { BusClient } from "./servicebus";


export class AzureServiceBusPubSub extends PubSub {
  private busclient: BusClient

  protected _subscribe(channel: string, callback: (err: Error) => void): void {
    throw new Error("Method not implemented.");
  }
  protected _unsubscribe(channel: string, callback: (err: Error) => void): void {
    throw new Error("Method not implemented.");
  }
  protected _publish(channels: string[], data: any, callback: (err: Error) => void): void {
    throw new Error("Method not implemented.");
  }
  constructor(connectString: string, options?: any)
  {
    super(options);
    this.busclient = new BusClient(connectString);
  }

}