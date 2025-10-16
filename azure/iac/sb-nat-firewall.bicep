// Service Bus (Standard): NAT egress + IP firewall (default Deny)
// Note: Private Endpoints require Premium tier; this template keeps Standard no-public effective via IP allowlist.

@description('Region')
param location string

@description('VNet name hosting the Function subnet')
param vnetName string

@description('Integration subnet (Functions) to attach NAT Gateway')
param integrationSubnetName string

@description('Service Bus namespace name (in same resource group)')
param serviceBusNamespaceName string

// Resources
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' existing = {
  name: vnetName
}

resource subnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' existing = {
  name: '${vnetName}/${integrationSubnetName}'
}

resource pip 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: 'nat-func-ip'
  location: location
  sku: { name: 'Standard' }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
  zones: [ '1', '2', '3' ]
}

resource nat 'Microsoft.Network/natGateways@2023-09-01' = {
  name: 'nat-func'
  location: location
  sku: { name: 'Standard' }
  properties: {
    publicIpAddresses: [ { id: pip.id } ]
  }
}

resource subnetUpdate 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' = {
  name: subnet.name
  properties: {
    addressPrefix: subnet.properties.addressPrefix
    natGateway: { id: nat.id }
  }
}

// Service Bus firewall (IP allowlist + defaultAction=Deny)
resource sb 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' existing = {
  name: serviceBusNamespaceName
}

resource sbRules 'Microsoft.ServiceBus/namespaces/networkRuleSets@2022-10-01-preview' = {
  name: '${serviceBusNamespaceName}/default'
  properties: {
    defaultAction: 'Deny'
    ipRules: [
      {
        ipMask: '${pip.properties.ipAddress}/32'
        action: 'Allow'
      }
    ]
    virtualNetworkRules: []
  }
  dependsOn: [ subnetUpdate ]
}

output natPublicIp string = pip.properties.ipAddress
output serviceBusRulesId string = sbRules.id

