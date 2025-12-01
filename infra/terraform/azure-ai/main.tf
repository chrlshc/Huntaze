/**
 * Azure AI Infrastructure
 * Terraform configuration for Azure OpenAI Service and related resources
 */

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Primary Azure region"
  type        = string
  default     = "eastus"
}

variable "secondary_location" {
  description = "Secondary Azure region for DR"
  type        = string
  default     = "eastus"
}

variable "resource_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "huntaze-ai"
}

# Resource Group
resource "azurerm_resource_group" "ai" {
  name     = "${var.resource_prefix}-${var.environment}-rg"
  location = var.location

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "Huntaze AI Migration"
  }
}

# Azure OpenAI Service - Primary Region (US East)
resource "azurerm_cognitive_account" "openai_primary" {
  name                = "${var.resource_prefix}-${var.environment}-openai-primary"
  location            = var.location
  resource_group_name = azurerm_resource_group.ai.name
  kind                = "OpenAI"
  sku_name            = "S0"

  custom_subdomain_name = "${var.resource_prefix}-${var.environment}-eastus"

  identity {
    type = "SystemAssigned"
  }

  network_acls {
    default_action = "Allow" # Change to "Deny" in production with private endpoints
  }

  tags = {
    Environment = var.environment
    Region      = "Primary"
  }
}

# Azure OpenAI Deployments - Primary
resource "azurerm_cognitive_deployment" "gpt4_turbo_primary" {
  name                 = "gpt-4-turbo-prod"
  cognitive_account_id = azurerm_cognitive_account.openai_primary.id

  model {
    format  = "OpenAI"
    name    = "gpt-4"
    version = "turbo-2024-04-09"
  }

  scale {
    type     = "Standard"
    capacity = 100 # Provisioned throughput units
  }
}

resource "azurerm_cognitive_deployment" "gpt4_primary" {
  name                 = "gpt-4-standard-prod"
  cognitive_account_id = azurerm_cognitive_account.openai_primary.id

  model {
    format  = "OpenAI"
    name    = "gpt-4"
    version = "0613"
  }

  scale {
    type     = "Standard"
    capacity = 50
  }
}

resource "azurerm_cognitive_deployment" "gpt35_turbo_primary" {
  name                 = "gpt-35-turbo-prod"
  cognitive_account_id = azurerm_cognitive_account.openai_primary.id

  model {
    format  = "OpenAI"
    name    = "gpt-35-turbo"
    version = "0125"
  }

  scale {
    type     = "Standard"
    capacity = 100
  }
}

resource "azurerm_cognitive_deployment" "gpt4_vision_primary" {
  name                 = "gpt-4-vision-prod"
  cognitive_account_id = azurerm_cognitive_account.openai_primary.id

  model {
    format  = "OpenAI"
    name    = "gpt-4"
    version = "vision-preview"
  }

  scale {
    type     = "Standard"
    capacity = 30
  }
}

resource "azurerm_cognitive_deployment" "embedding_primary" {
  name                 = "text-embedding-ada-002-prod"
  cognitive_account_id = azurerm_cognitive_account.openai_primary.id

  model {
    format  = "OpenAI"
    name    = "text-embedding-ada-002"
    version = "2"
  }

  scale {
    type     = "Standard"
    capacity = 50
  }
}

# Azure Key Vault for secrets management
resource "azurerm_key_vault" "ai" {
  name                = "${var.resource_prefix}-${var.environment}-kv"
  location            = var.location
  resource_group_name = azurerm_resource_group.ai.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "premium"

  enable_rbac_authorization = true
  purge_protection_enabled  = true

  network_acls {
    default_action = "Allow" # Change to "Deny" in production
    bypass         = "AzureServices"
  }

  tags = {
    Environment = var.environment
  }
}

# Store OpenAI API key in Key Vault
resource "azurerm_key_vault_secret" "openai_primary_key" {
  name         = "azure-openai-primary-key"
  value        = azurerm_cognitive_account.openai_primary.primary_access_key
  key_vault_id = azurerm_key_vault.ai.id

  depends_on = [azurerm_key_vault.ai]
}

# Azure Cognitive Search for vector storage
resource "azurerm_search_service" "cognitive_search" {
  name                = "${var.resource_prefix}-${var.environment}-search"
  location            = var.location
  resource_group_name = azurerm_resource_group.ai.name
  sku                 = "standard"
  replica_count       = 3
  partition_count     = 1

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
  }
}

# Application Insights for monitoring
resource "azurerm_log_analytics_workspace" "ai" {
  name                = "${var.resource_prefix}-${var.environment}-logs"
  location            = var.location
  resource_group_name = azurerm_resource_group.ai.name
  sku                 = "PerGB2018"
  retention_in_days   = 90

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_application_insights" "ai" {
  name                = "${var.resource_prefix}-${var.environment}-insights"
  location            = var.location
  resource_group_name = azurerm_resource_group.ai.name
  workspace_id        = azurerm_log_analytics_workspace.ai.id
  application_type    = "web"

  tags = {
    Environment = var.environment
  }
}

# Data source for current Azure client config
data "azurerm_client_config" "current" {}

# Outputs
output "openai_primary_endpoint" {
  value       = azurerm_cognitive_account.openai_primary.endpoint
  description = "Primary Azure OpenAI endpoint (US East)"
}

output "cognitive_search_endpoint" {
  value       = "https://${azurerm_search_service.cognitive_search.name}.search.windows.net"
  description = "Azure Cognitive Search endpoint"
}

output "application_insights_connection_string" {
  value       = azurerm_application_insights.ai.connection_string
  description = "Application Insights connection string"
  sensitive   = true
}

output "application_insights_instrumentation_key" {
  value       = azurerm_application_insights.ai.instrumentation_key
  description = "Application Insights instrumentation key"
  sensitive   = true
}

output "key_vault_uri" {
  value       = azurerm_key_vault.ai.vault_uri
  description = "Key Vault URI"
}
