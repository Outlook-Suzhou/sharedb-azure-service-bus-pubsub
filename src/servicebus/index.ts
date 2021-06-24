import { ServiceBusClient, ServiceBusAdministrationClient, CreateTopicOptions, CreateSubscriptionOptions, WithResponse, TopicProperties, SubscribeOptions, MessageHandlers, ServiceBusReceiver } from "@azure/service-bus";
import { RestError } from "@azure/core-http";
import { v4 as uuidv4 } from 'uuid';
import { channel } from "diagnostic_channel";

export class BusClient
{
    private connectString: string;
    public serviceBusClient : ServiceBusClient
    private serviceBusAdministrationClient : ServiceBusAdministrationClient
    private topicMap: Map<string, ServiceBusReceiver>

    public constructor(connectString: string)
    {
        this.connectString = connectString;
        this.serviceBusClient = new ServiceBusClient(this.connectString);
        this.serviceBusAdministrationClient = new ServiceBusAdministrationClient(this.connectString);
        this.topicMap = new Map<string, ServiceBusReceiver>();
    }

    public async createTopic(topic: string)
    {
        const opt : CreateTopicOptions = {
            defaultMessageTimeToLive: "PT24H",
            autoDeleteOnIdle : "PT24H",
        }
        await this.serviceBusAdministrationClient.createTopic(topic, opt)
    }

    public async createSubscription(topic: string, subscription: string) : Promise<string>
    {
        const opt : CreateSubscriptionOptions = {
            autoDeleteOnIdle: "PT1H"
        }
        await this.serviceBusAdministrationClient.createSubscription(topic, subscription, opt);
        return subscription;
    }

    public async createTopicIfNotExist(topic: string)
    {
        try {
            await this.serviceBusAdministrationClient.getTopic(topic);
        } catch(error) {
            const restError = error as RestError;
            if(restError.code == "MessageEntityNotFoundError")
            {
                await this.createTopic(topic)
            }
            else
            {
                throw error;
            }
        }
    }

    public async createSubscriptionIfNotExist(topic: string, subscription: string)
    {
        try {
            let remoteSubscription = await this.serviceBusAdministrationClient.getSubscription(topic, subscription);
        }
        catch (error)
        {
            const restError = error as RestError;
            if(restError.code == "MessageEntityNotFoundError")
            {
                await this.createSubscription(topic, subscription);
            }
            else
            {
                throw error;
            }
        }
    }
    
    public async subscribe(topic: string, 
        messageHandler: (messageOrError: any) => Promise<void>, 
        errorHandler: (messageOrError: any) => Promise<void>)
    {
        var subscription = uuidv4();
        await this.createSubscriptionIfNotExist(topic, subscription);
        let receiver = this.serviceBusClient.createReceiver(topic, subscription);
        let handlers: MessageHandlers = {
            processMessage: messageHandler,
            processError: errorHandler
        };
        receiver.subscribe(handlers);
        this.topicMap.set(topic, receiver);
    }

    public async unSubscribe(topic: string)
    {
        let receiver = this.topicMap.get(topic);
        if(receiver)
        {
            await receiver.close();
        }
    }

    public async sendMessage(topic: string, message: any)
    {
        //Todo: we need a buffer
        let sender = this.serviceBusClient.createSender(topic);
        try{
            await sender.sendMessages(message);
        }
        finally
        {
            sender.close();
        }
    }
}