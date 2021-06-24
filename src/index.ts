import { PubSub } from 'sharedb';
import { Error } from "sharedb/lib/sharedb";
import { BusClient } from "./servicebus";


export class AzureServiceBusPubSub extends PubSub {
  private busclient: BusClient

  protected override _subscribe(channel: string, callback: (err: Error) => void): void {
    this.busclient.createTopicIfNotExist(channel)
      .then(() => {
        const messageHandler = (data: any) => {
          this._emit(channel, data.data);
          return Promise.resolve();
        };

        const errorHandler = (error: any) => {
          console.error(error);
          return Promise.resolve();
        };

        return this.busclient.subscribe(channel, messageHandler, errorHandler)
          .then(() => callback(null));
      }).catch(e => callback(e));
  }

  protected override _unsubscribe(channel: string, callback: (err: Error) => void): void {
    this.busclient.unSubscribe(channel).then(() => callback(null)).catch((e) => callback(e));
  }

  protected override _publish(channels: string[], data: any, callback: (err: Error) => void): void {
    const tasks = channels.map(channel => this.busclient.sendMessage(channel, { data }));
    Promise.all(tasks).then(() => callback(null)).catch(e => callback(e));
  }

  constructor(connectString: string, options?: any) {
    super(options);
    this.busclient = new BusClient(connectString);
  }
}