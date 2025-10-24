variable "aws_region" { type = string }
variable "private_subnets" { type = list(string) }
variable "sg_id" { type = string }

variable "summarizer_image" { type = string }
variable "database_url" { type = string }
variable "azure_endpoint" { type = string }
variable "azure_deployment" { type = string }
variable "azure_api_key" { type = string }

