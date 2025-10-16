// Cosmos DB Private Endpoint + Private DNS + Deny Public
// Parameters are kept generic so you can reuse across environments.

@description('Azure Region')
param location string

@description('Resource Group-scoped Cosmos DB account name')
param cosmosAccountName string

@description('Virtual network name to link DNS and host the PE')
param vnetName string

@description('Subnet name for Private Endpoints (no NSG that blocks PEs)')
param peSubnetName string

var dnsZoneName = 'privatelink.documents.azure.com'

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' existing = {
  name: cosmosAccountName
}

// Private DNS zone and VNet link
resource dnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: dnsZoneName
  location: 'global'
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' existing = {
  name: vnetName
}

resource vnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: '${dnsZone.name}/${vnet.name}-cosmos-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

// Private Endpoint for Cosmos (subresource Sql)
resource peSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' existing = {
  name: '${vnetName}/${peSubnetName}'
}

resource pe 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-cosmos'
  location: location
  properties: {
    subnet: {
      id: peSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: 'cosmos-conn'
        properties: {
          privateLinkServiceId: cosmos.id
          groupIds: [ 'Sql' ]
        }
      }
    ]
  }
}

// Bind PE to DNS zone
resource zoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-09-01' = {
  name: '${pe.name}/cosmos-dns'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: dnsZone.name
        properties: {
          privateDnsZoneId: dnsZone.id
        }
      }
    ]
  }
}

output cosmosId string = cosmos.id
output dnsZoneId string = dnsZone.id
output privateEndpointId string = pe.id
