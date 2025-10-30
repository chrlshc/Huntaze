#!/bin/bash
# Fix Terraform duplicate resources

set -e

echo "🔧 Fixing Terraform duplicate resources..."

cd infra/terraform/production-hardening

# 1. Remove duplicate ECS cluster data sources from ecs-auto-scaling.tf
echo "Fixing ECS cluster duplicates..."
sed -i.bak '/^data "aws_ecs_cluster" "ai_team" {/,/^}/d' ecs-auto-scaling.tf

# 2. Remove duplicate RDS alarms from rds-performance-insights.tf
echo "Fixing RDS alarm duplicates..."
sed -i.bak '/^resource "aws_cloudwatch_metric_alarm" "rds_read_latency_high" {/,/^}/d' rds-performance-insights.tf
sed -i.bak '/^resource "aws_cloudwatch_metric_alarm" "rds_write_latency_high" {/,/^}/d' rds-performance-insights.tf

# 3. Remove duplicate variable from variables.tf
echo "Fixing variable duplicates..."
sed -i.bak '/^variable "rds_instance_identifier" {/,/^}/d' variables.tf

# 4. Remove duplicate VPC data sources from vpc-endpoints.tf
echo "Fixing VPC duplicates..."
sed -i.bak '/^data "aws_vpc" "main" {/,/^}/d' vpc-endpoints.tf
sed -i.bak '/^data "aws_route_tables" "private" {/,/^}/d' vpc-endpoints.tf

# 5. Remove duplicate S3 VPC endpoint from vpc-endpoints.tf
echo "Fixing S3 VPC endpoint duplicate..."
sed -i.bak '/^resource "aws_vpc_endpoint" "s3" {/,/^}/d' vpc-endpoints.tf

# Clean up backup files
rm -f *.bak

echo "✅ Terraform duplicates fixed!"
echo "Now run: terraform init -upgrade"
