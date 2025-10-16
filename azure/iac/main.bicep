@description('Location, RG = celui du déploiement')
param location string = resourceGroup().location

@description('Virtual Network qui héberge l’intégration Functions + les PEs')
param vnetName string
@description('Subnet pour Private Endpoints (sans NSG bloquant)')
param peSubnetName string

@description('Azure OpenAI account name (ex: huntaze-ai-eus2-29796)')
param aoaiAccountName string
@description('Azure AI Services hub (CS/Language) account name (ex: huntaze-ai-hub-eus2)')
param aiServicesAccountName string
@description('Cosmos DB account name')
param cosmosAccountName string

@allowed([
  true
  false
])
@description('Créer le PE AOAI + DNS')
param enableAoaiPE bool = true

@allowed([
  true
  false
])
@description('Créer le PE AI Services (CS/Language) + DNS')
param enableAiServicesPE bool = true

@allowed([
  true
  false
])
@description('Créer le PE Cosmos + DNS')
param enableCosmosPE bool = true

// ========== EXISTING RESOURCES ==========
resource vnet 'Microsoft.Network/virtualNetworks@2024-03-01' existing = {
  name: vnetName
}

resource peSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-03-01' existing = {
  parent: vnet
  name: peSubnetName
}

resource aoai 'Microsoft.CognitiveServices/accounts@2023-05-01' existing = {
  name: aoaiAccountName
}

resource aisvc 'Microsoft.CognitiveServices/accounts@2023-05-01' existing = {
  name: aiServicesAccountName
}

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-08-15' existing = {
  name: cosmosAccountName
}

// ========== PRIVATE DNS ZONES ==========
resource zoneAoai 'Microsoft.Network/privateDnsZones@2020-06-01' = if (enableAoaiPE) {
  name: 'privatelink.openai.azure.com'
  location: 'global'
}

resource zoneCog 'Microsoft.Network/privateDnsZones@2020-06-01' = if (enableAiServicesPE) {
  name: 'privatelink.cognitiveservices.azure.com'
  location: 'global'
}

resource zoneCosmos 'Microsoft.Network/privateDnsZones@2020-06-01' = if (enableCosmosPE) {
  name: 'privatelink.documents.azure.com'
  location: 'global'
}

// VNet links (registrationEnabled=false pour éviter les conflits d’auto-reg)
resource linkAoai 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (enableAoaiPE) {
  name: '${zoneAoai.name}/${vnet.name}-oai-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

resource linkCog 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (enableAiServicesPE) {
  name: '${zoneCog.name}/${vnet.name}-cog-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

resource linkCosmos 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (enableCosmosPE) {
  name: '${zoneCosmos.name}/${vnet.name}-cosmos-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

// ========== PRIVATE ENDPOINTS + DNS ZONE GROUPS ==========
resource peAoai 'Microsoft.Network/privateEndpoints@2024-03-01' = if (enableAoaiPE) {
  name: 'pe-aoai'
  location: location
  properties: {
    subnet: {
      id: peSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: 'aoai-conn'
        properties: {
          privateLinkServiceId: aoai.id
          groupIds: [ 'account' ]
        }
      }
    ]
  }
}
resource peAoaiZone 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-03-01' = if (enableAoaiPE) {
  name: 'aoai-dns'
  parent: peAoai
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'aoai-zone'
        properties: {
          privateDnsZoneId: zoneAoai.id
        }
      }
    ]
  }
}

resource peCog 'Microsoft.Network/privateEndpoints@2024-03-01' = if (enableAiServicesPE) {
  name: 'pe-cog'
  location: location
  properties: {
    subnet: {
      id: peSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: 'cog-conn'
        properties: {
          privateLinkServiceId: aisvc.id
          groupIds: [ 'account' ]
        }
      }
    ]
  }
}
resource peCogZone 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-03-01' = if (enableAiServicesPE) {
  name: 'cs-dns'
  parent: peCog
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'cog-zone'
        properties: {
          privateDnsZoneId: zoneCog.id
        }
      }
    ]
  }
}

resource peCosmos 'Microsoft.Network/privateEndpoints@2024-03-01' = if (enableCosmosPE) {
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
resource peCosmosZone 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-03-01' = if (enableCosmosPE) {
  name: 'cosmos-dns'
  parent: peCosmos
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'cosmos-zone'
        properties: {
          privateDnsZoneId: zoneCosmos.id
        }
      }
    ]
  }
}

// ========== OUTPUTS ==========
@description('AOAI Private Endpoint ID (si créé)')
output aoaiPrivateEndpointId string = enableAoaiPE ? peAoai.id : ''
@description('AI Services Private Endpoint ID (si créé)')
output cogPrivateEndpointId string = enableAiServicesPE ? peCog.id : ''
@description('Cosmos Private Endpoint ID (si créé)')
output cosmosPrivateEndpointId string = enableCosmosPE ? peCosmos.id : ''

