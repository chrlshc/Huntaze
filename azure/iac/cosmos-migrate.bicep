param accountName string
param location string
param databaseName string = 'huntaze'
param containerSessions string = 'ai_sessions'
param containerMessages string = 'ai_session_messages'
param containerArtifacts string = 'ai_session_artifacts'

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        failoverPriority: 0
        locationName: location
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

resource db 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  name: '${cosmos.name}/${databaseName}'
  properties: {
    resource: {
      id: databaseName
    }
  }
}

@description('Creates a SQL container with partition key /session_id and default TTL off')
module contSessions 'modules/sqlContainer.bicep' = {
  name: 'sessionsContainer'
  params: {
    accountName: cosmos.name
    databaseName: databaseName
    containerName: containerSessions
    partitionKey: '/session_id'
  }
}

module contMessages 'modules/sqlContainer.bicep' = {
  name: 'messagesContainer'
  params: {
    accountName: cosmos.name
    databaseName: databaseName
    containerName: containerMessages
    partitionKey: '/session_id'
  }
}

module contArtifacts 'modules/sqlContainer.bicep' = {
  name: 'artifactsContainer'
  params: {
    accountName: cosmos.name
    databaseName: databaseName
    containerName: containerArtifacts
    partitionKey: '/session_id'
  }
}
