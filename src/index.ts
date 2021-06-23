import { ServiceBusClient } from "@azure/service-bus";
const PubSub = require('sharedb').PubSub;

// AzureServiceBus pubsub driver for ShareDB.
function AzureServiceBusPubSub(options) : void {
  if (!(this instanceof AzureServiceBusPubSub)) return new AzureServiceBusPubSub(options);
  PubSub.call(this, options);
  options || (options = {});

  this.client = options.client ||  new ServiceBusClient(options.connectionString);
  this.receiverMap = {};
}

module.exports = AzureServiceBusPubSub;

AzureServiceBusPubSub.prototype = Object.create(PubSub.prototype);

AzureServiceBusPubSub.prototype.close = function(callback) {
  if (!callback) {
    callback = function(err) {
      if (err) throw err;
    };
  }
  var pubsub = this;
  PubSub.prototype.close.call(this, async function(err) {
    if (err) return callback(err);
    for (const [key, value] of pubsub.receiverMap.entries()) {
      if(value)
      {
        await value.close();
      }
    }
    await PubSub.client.close()
  });
};

AzureServiceBusPubSub.prototype._subscribe = function(channel, callback) {
  var pubsub = this;
  const myMessageHandler = async (messageReceived) => {
		var data = JSON.parse(messageReceived);
    pubsub._emit(channel, data);
	};

	// function to handle any errors
	const myErrorHandler = async (error) => {
		console.log(error);
	};
  const receiver = this.client.createReceiver(channel);
  receiver.subscribe({
		processMessage: myMessageHandler,
		processError: myErrorHandler
	});

  this.receiverMap[channel] = receiver;
  callback();
};

AzureServiceBusPubSub.prototype._unsubscribe = async function(channel, callback) {
  if(this.receiverMap[channel])
  {
    await this.receiverMap[channel].close();
  }
  callback();
};

AzureServiceBusPubSub.prototype._publish = async function(channels, data, callback) {
  // Todo we need a buffer
  const sender = this.client.createSender(channels);
  try {
    let batch = await sender.createMessageBatch();
    if (batch.tryAddMessage(data)) {
      await sender.sendMessages(batch);
    } else {
      callback("Message too big to fit in a batch");
    }
  }
  finally{
    await sender.close();      
  }
  callback();
};