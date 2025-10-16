param accountName string
param databaseName string
param containerName string
param partitionKey string
param defaultTtl int = -1 // -1 disabled, else seconds

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  name: '${accountName}/${databaseName}/${containerName}'
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: [ partitionKey ]
        kind: 'Hash'
      }
      defaultTtl: defaultTtl
    }
    options: {}
  }
}

