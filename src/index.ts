import {PubSub} from 'sharedb'
import { Error } from "sharedb/lib/sharedb";
import { BusClient } from "./servicebus";


export class AzureServiceBusPubSub extends PubSub {
  private busclient: BusClient

  protected _subscribe(channel: string, callback: (err: Error) => void): void {
    this.busclient.createTopicIfNotExist(channel)
    .then(() => {
      let messageHandler = async (data: any) => {
        this._emit(channel, data.data);
      }
  
      let errorHandler = async (error : any) => {
        console.error(error)
      }
  
      this.busclient.subscribe(channel, messageHandler, errorHandler)
      .then(() => callback(null))
      .catch((e) => callback(e));
    }).catch(e => callback(e));
  }

  protected _unsubscribe(channel: string, callback: (err: Error) => void): void {
    this.busclient.unSubscribe(channel).then(() => callback(null)).catch((e) => callback(e));
  }

  protected _publish(channels: string[], data: any, callback: (err: Error) => void): void {
    var tasks = [];
    for(const channel of channels)
    {
      tasks.push(this.busclient.sendMessage(channel, {data: data}));   
    }
    Promise.all(tasks).then(() => callback(null)).catch(e => callback(e));
  }

  constructor(connectString: string, options?: any)
  {
    super(options);
    this.busclient = new BusClient(connectString);
  }
}