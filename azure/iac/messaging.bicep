param nsName string
param location string
param queueName string = 'autogen-drafts'
param topicName string = 'huntaze-events'

resource sb 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: nsName
  location: location
  sku: {
    name: 'Premium'
    tier: 'Premium'
    capacity: 1
  }
}

resource queue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  name: '${sb.name}/${queueName}'
  properties: {
    maxDeliveryCount: 10
    deadLetteringOnMessageExpiration: true
  }
}

resource eg 'Microsoft.EventGrid/topics@2023-12-15-preview' = {
  name: topicName
  location: location
}

