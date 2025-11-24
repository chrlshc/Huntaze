#!/usr/bin/env tsx
/**
 * Verify AWS Resources (RDS and ElastiCache)
 * 
 * This script checks if your RDS database and ElastiCache Redis cluster
 * are properly configured and accessible.
 * 
 * Usage: npx tsx scripts/verify-aws-resources.ts
 */

import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from '@aws-sdk/client-rds';
import { 
  ElastiCacheClient, 
  DescribeCacheClustersCommand 
} from '@aws-sdk/client-elasticache';

async function verifyAWSResources() {
  console.log('🔍 Verifying AWS Resources...\n');

  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Check if AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in environment variables');
    console.log('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  console.log(`📍 Region: ${region}\n`);

  // Verify RDS Database
  console.log('🗄️  Checking RDS Database...');
  try {
    const rdsClient = new RDSClient({ region });
    const rdsCommand = new DescribeDBInstancesCommand({});
    const rdsResponse = await rdsClient.send(rdsCommand);

    if (rdsResponse.DBInstances && rdsResponse.DBInstances.length > 0) {
      console.log(`✅ Found ${rdsResponse.DBInstances.length} RDS instance(s):\n`);
      
      rdsResponse.DBInstances.forEach((db) => {
        console.log(`   📊 ${db.DBInstanceIdentifier}`);
        console.log(`      Engine: ${db.Engine} ${db.EngineVersion}`);
        console.log(`      Status: ${db.DBInstanceStatus}`);
        console.log(`      Endpoint: ${db.Endpoint?.Address}:${db.Endpoint?.Port}`);
        console.log(`      VPC: ${db.DBSubnetGroup?.VpcId || 'N/A'}`);
        console.log('');
      });

      // Extract DATABASE_URL format
      const mainDb = rdsResponse.DBInstances[0];
      if (mainDb.Endpoint) {
        console.log('   💡 DATABASE_URL format:');
        console.log(`      postgresql://username:password@${mainDb.Endpoint.Address}:${mainDb.Endpoint.Port}/database_name?sslmode=require\n`);
      }
    } else {
      console.log('⚠️  No RDS instances found\n');
    }
  } catch (error: any) {
    console.error('❌ Failed to check RDS:', error.message);
    console.log('');
  }

  // Verify ElastiCache Redis
  console.log('🔴 Checking ElastiCache Redis...');
  try {
    const elasticacheClient = new ElastiCacheClient({ region });
    const cacheCommand = new DescribeCacheClustersCommand({
      ShowCacheNodeInfo: true
    });
    const cacheResponse = await elasticacheClient.send(cacheCommand);

    if (cacheResponse.CacheClusters && cacheResponse.CacheClusters.length > 0) {
      console.log(`✅ Found ${cacheResponse.CacheClusters.length} ElastiCache cluster(s):\n`);
      
      cacheResponse.CacheClusters.forEach((cluster) => {
        console.log(`   📊 ${cluster.CacheClusterId}`);
        console.log(`      Engine: ${cluster.Engine} ${cluster.EngineVersion}`);
        console.log(`      Status: ${cluster.CacheClusterStatus}`);
        console.log(`      Node Type: ${cluster.CacheNodeType}`);
        
        if (cluster.CacheNodes && cluster.CacheNodes.length > 0) {
          const node = cluster.CacheNodes[0];
          console.log(`      Endpoint: ${node.Endpoint?.Address}:${node.Endpoint?.Port}`);
          
          // Extract Redis URL format
          console.log('\n   💡 REDIS_URL format (for Upstash Redis):');
          console.log(`      UPSTASH_REDIS_REST_URL=https://${node.Endpoint?.Address}:${node.Endpoint?.Port}`);
          console.log(`      UPSTASH_REDIS_REST_TOKEN=your-token-here`);
          console.log('\n   💡 Or for ioredis:');
          console.log(`      REDIS_HOST=${node.Endpoint?.Address}`);
          console.log(`      REDIS_PORT=${node.Endpoint?.Port}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  No ElastiCache clusters found\n');
    }
  } catch (error: any) {
    console.error('❌ Failed to check ElastiCache:', error.message);
    console.log('');
  }

  console.log('✅ Verification complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Copy the endpoint URLs above');
  console.log('   2. Add them to your Amplify environment variables');
  console.log('   3. Ensure your VPC security groups allow connections');
}

verifyAWSResources().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
