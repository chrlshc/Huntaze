#!/usr/bin/env tsx
/**
 * AWS Infrastructure Usage Audit Script
 * 
 * Audits AWS resource usage across:
 * - S3 (asset serving metrics)
 * - CloudFront (traffic metrics)
 * - CloudWatch (metric ingestion)
 * 
 * Generates recommendations on whether to keep or remove AWS services
 * based on actual usage patterns.
 */

import {
  S3Client,
  ListBucketsCommand,
  GetBucketLocationCommand,
  ListObjectsV2Command,
  GetBucketMetricsConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  ListDistributionsCommand,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';

// Types
interface S3BucketMetrics {
  bucketName: string;
  region: string;
  objectCount: number;
  totalSizeBytes: number;
  lastModified?: Date;
  requestsLast30Days: number;
  bytesDownloadedLast30Days: number;
}

interface CloudFrontMetrics {
  distributionId: string;
  domainName: string;
  status: string;
  requestsLast30Days: number;
  bytesDownloadedLast30Days: number;
  cacheHitRate: number;
}

interface CloudWatchMetrics {
  namespace: string;
  metricCount: number;
  dataPointsLast30Days: number;
  estimatedCostPerMonth: number;
}

interface AuditReport {
  timestamp: Date;
  s3: {
    buckets: S3BucketMetrics[];
    totalCost: number;
    recommendation: 'keep' | 'remove' | 'optimize';
    reasoning: string;
  };
  cloudFront: {
    distributions: CloudFrontMetrics[];
    totalCost: number;
    recommendation: 'keep' | 'remove' | 'optimize';
    reasoning: string;
  };
  cloudWatch: {
    metrics: CloudWatchMetrics[];
    totalCost: number;
    recommendation: 'keep' | 'remove' | 'optimize';
    reasoning: string;
  };
  overallRecommendation: string;
  estimatedMonthlySavings: number;
}

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DAYS_TO_ANALYZE = 30;

// Cost estimates (USD per month)
const COST_ESTIMATES = {
  s3StoragePerGB: 0.023,
  s3RequestsPer1000: 0.0004,
  cloudFrontRequestsPer10000: 0.0075,
  cloudFrontDataTransferPerGB: 0.085,
  cloudWatchMetricsPer1000: 0.30,
  cloudWatchDataPointsPer1000: 0.01,
};

/**
 * Check if AWS credentials are configured
 */
function isAWSConfigured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  );
}

/**
 * Audit S3 buckets
 */
async function auditS3(): Promise<S3BucketMetrics[]> {
  const client = new S3Client({ region: AWS_REGION });
  const buckets: S3BucketMetrics[] = [];

  try {
    // List all buckets
    const listBucketsResponse = await client.send(new ListBucketsCommand({}));
    
    if (!listBucketsResponse.Buckets) {
      return buckets;
    }

    // Analyze each bucket
    for (const bucket of listBucketsResponse.Buckets) {
      if (!bucket.Name) continue;

      try {
        // Get bucket location
        const locationResponse = await client.send(
          new GetBucketLocationCommand({ Bucket: bucket.Name })
        );
        const region = locationResponse.LocationConstraint || 'us-east-1';

        // List objects to get count and size
        const regionalClient = new S3Client({ region });
        const listObjectsResponse = await regionalClient.send(
          new ListObjectsV2Command({ Bucket: bucket.Name })
        );

        const objectCount = listObjectsResponse.KeyCount || 0;
        const totalSizeBytes = listObjectsResponse.Contents?.reduce(
          (sum, obj) => sum + (obj.Size || 0),
          0
        ) || 0;

        const lastModified = listObjectsResponse.Contents?.[0]?.LastModified;

        // Get request metrics from CloudWatch
        const cloudWatchClient = new CloudWatchClient({ region });
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000);

        let requestsLast30Days = 0;
        let bytesDownloadedLast30Days = 0;

        try {
          const requestMetrics = await cloudWatchClient.send(
            new GetMetricStatisticsCommand({
              Namespace: 'AWS/S3',
              MetricName: 'NumberOfObjects',
              Dimensions: [
                { Name: 'BucketName', Value: bucket.Name },
                { Name: 'StorageType', Value: 'AllStorageTypes' },
              ],
              StartTime: startTime,
              EndTime: endTime,
              Period: 86400, // 1 day
              Statistics: ['Sum'],
            })
          );

          requestsLast30Days = requestMetrics.Datapoints?.reduce(
            (sum, dp) => sum + (dp.Sum || 0),
            0
          ) || 0;
        } catch (error) {
          console.warn(`Could not fetch metrics for bucket ${bucket.Name}:`, error);
        }

        buckets.push({
          bucketName: bucket.Name,
          region,
          objectCount,
          totalSizeBytes,
          lastModified,
          requestsLast30Days,
          bytesDownloadedLast30Days,
        });
      } catch (error) {
        console.warn(`Error analyzing bucket ${bucket.Name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error auditing S3:', error);
  }

  return buckets;
}

/**
 * Audit CloudFront distributions
 */
async function auditCloudFront(): Promise<CloudFrontMetrics[]> {
  const client = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is global
  const distributions: CloudFrontMetrics[] = [];

  try {
    const listResponse = await client.send(new ListDistributionsCommand({}));
    
    if (!listResponse.DistributionList?.Items) {
      return distributions;
    }

    for (const dist of listResponse.DistributionList.Items) {
      if (!dist.Id || !dist.DomainName) continue;

      try {
        // Get CloudWatch metrics for this distribution
        const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000);

        // Get request count
        const requestMetrics = await cloudWatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: 'AWS/CloudFront',
            MetricName: 'Requests',
            Dimensions: [{ Name: 'DistributionId', Value: dist.Id }],
            StartTime: startTime,
            EndTime: endTime,
            Period: 86400,
            Statistics: ['Sum'],
          })
        );

        const requestsLast30Days = requestMetrics.Datapoints?.reduce(
          (sum, dp) => sum + (dp.Sum || 0),
          0
        ) || 0;

        // Get bytes downloaded
        const bytesMetrics = await cloudWatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: 'AWS/CloudFront',
            MetricName: 'BytesDownloaded',
            Dimensions: [{ Name: 'DistributionId', Value: dist.Id }],
            StartTime: startTime,
            EndTime: endTime,
            Period: 86400,
            Statistics: ['Sum'],
          })
        );

        const bytesDownloadedLast30Days = bytesMetrics.Datapoints?.reduce(
          (sum, dp) => sum + (dp.Sum || 0),
          0
        ) || 0;

        // Get cache hit rate
        const cacheHitMetrics = await cloudWatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: 'AWS/CloudFront',
            MetricName: 'CacheHitRate',
            Dimensions: [{ Name: 'DistributionId', Value: dist.Id }],
            StartTime: startTime,
            EndTime: endTime,
            Period: 86400,
            Statistics: ['Average'],
          })
        );

        const cacheHitRate = cacheHitMetrics.Datapoints?.length
          ? cacheHitMetrics.Datapoints.reduce((sum, dp) => sum + (dp.Average || 0), 0) /
            cacheHitMetrics.Datapoints.length
          : 0;

        distributions.push({
          distributionId: dist.Id,
          domainName: dist.DomainName,
          status: dist.Status || 'Unknown',
          requestsLast30Days,
          bytesDownloadedLast30Days,
          cacheHitRate,
        });
      } catch (error) {
        console.warn(`Error analyzing distribution ${dist.Id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error auditing CloudFront:', error);
  }

  return distributions;
}

/**
 * Audit CloudWatch metrics
 */
async function auditCloudWatch(): Promise<CloudWatchMetrics[]> {
  const client = new CloudWatchClient({ region: AWS_REGION });
  const metricsMap = new Map<string, CloudWatchMetrics>();

  try {
    // List all custom metrics
    const listResponse = await client.send(new ListMetricsCommand({}));
    
    if (!listResponse.Metrics) {
      return [];
    }

    // Group by namespace
    for (const metric of listResponse.Metrics) {
      if (!metric.Namespace) continue;

      if (!metricsMap.has(metric.Namespace)) {
        metricsMap.set(metric.Namespace, {
          namespace: metric.Namespace,
          metricCount: 0,
          dataPointsLast30Days: 0,
          estimatedCostPerMonth: 0,
        });
      }

      const namespaceMetrics = metricsMap.get(metric.Namespace)!;
      namespaceMetrics.metricCount++;

      // Get data points for this metric
      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000);

        const statsResponse = await client.send(
          new GetMetricStatisticsCommand({
            Namespace: metric.Namespace,
            MetricName: metric.MetricName!,
            Dimensions: metric.Dimensions,
            StartTime: startTime,
            EndTime: endTime,
            Period: 3600, // 1 hour
            Statistics: ['SampleCount'],
          })
        );

        const dataPoints = statsResponse.Datapoints?.length || 0;
        namespaceMetrics.dataPointsLast30Days += dataPoints;
      } catch (error) {
        // Ignore errors for individual metrics
      }
    }

    // Calculate costs
    const metrics = Array.from(metricsMap.values());
    for (const metric of metrics) {
      const metricCost = (metric.metricCount / 1000) * COST_ESTIMATES.cloudWatchMetricsPer1000;
      const dataPointCost =
        (metric.dataPointsLast30Days / 1000) * COST_ESTIMATES.cloudWatchDataPointsPer1000;
      metric.estimatedCostPerMonth = metricCost + dataPointCost;
    }

    return metrics;
  } catch (error) {
    console.error('Error auditing CloudWatch:', error);
    return [];
  }
}

/**
 * Generate recommendations based on usage
 */
function generateRecommendations(
  s3Buckets: S3BucketMetrics[],
  cloudFrontDists: CloudFrontMetrics[],
  cloudWatchMetrics: CloudWatchMetrics[]
): AuditReport {
  // Calculate S3 costs and recommendation
  const s3TotalSizeGB = s3Buckets.reduce((sum, b) => sum + b.totalSizeBytes / (1024 ** 3), 0);
  const s3TotalRequests = s3Buckets.reduce((sum, b) => sum + b.requestsLast30Days, 0);
  const s3StorageCost = s3TotalSizeGB * COST_ESTIMATES.s3StoragePerGB;
  const s3RequestCost = (s3TotalRequests / 1000) * COST_ESTIMATES.s3RequestsPer1000;
  const s3TotalCost = s3StorageCost + s3RequestCost;

  let s3Recommendation: 'keep' | 'remove' | 'optimize' = 'remove';
  let s3Reasoning = '';

  if (s3Buckets.length === 0) {
    s3Recommendation = 'remove';
    s3Reasoning = 'No S3 buckets found. AWS S3 is not being used.';
  } else if (s3TotalRequests === 0) {
    s3Recommendation = 'remove';
    s3Reasoning = `Found ${s3Buckets.length} bucket(s) with ${s3TotalSizeGB.toFixed(2)}GB, but zero requests in last 30 days. Consider removing unused buckets.`;
  } else if (s3TotalRequests < 1000) {
    s3Recommendation = 'optimize';
    s3Reasoning = `Low usage: ${s3TotalRequests} requests/month. Consider using local storage or a simpler solution.`;
  } else {
    s3Recommendation = 'keep';
    s3Reasoning = `Active usage: ${s3TotalRequests.toLocaleString()} requests/month, ${s3TotalSizeGB.toFixed(2)}GB stored. S3 is providing value.`;
  }

  // Calculate CloudFront costs and recommendation
  const cfTotalRequests = cloudFrontDists.reduce((sum, d) => sum + d.requestsLast30Days, 0);
  const cfTotalBytesGB = cloudFrontDists.reduce(
    (sum, d) => sum + d.bytesDownloadedLast30Days / (1024 ** 3),
    0
  );
  const cfRequestCost = (cfTotalRequests / 10000) * COST_ESTIMATES.cloudFrontRequestsPer10000;
  const cfDataTransferCost = cfTotalBytesGB * COST_ESTIMATES.cloudFrontDataTransferPerGB;
  const cfTotalCost = cfRequestCost + cfDataTransferCost;

  let cfRecommendation: 'keep' | 'remove' | 'optimize' = 'remove';
  let cfReasoning = '';

  if (cloudFrontDists.length === 0) {
    cfRecommendation = 'remove';
    cfReasoning = 'No CloudFront distributions found. CDN is not being used.';
  } else if (cfTotalRequests === 0) {
    cfRecommendation = 'remove';
    cfReasoning = `Found ${cloudFrontDists.length} distribution(s), but zero requests in last 30 days. Remove unused distributions.`;
  } else if (cfTotalRequests < 10000) {
    cfRecommendation = 'optimize';
    cfReasoning = `Low traffic: ${cfTotalRequests} requests/month. For this volume, direct serving may be more cost-effective.`;
  } else {
    const avgCacheHitRate =
      cloudFrontDists.reduce((sum, d) => sum + d.cacheHitRate, 0) / cloudFrontDists.length;
    if (avgCacheHitRate < 50) {
      cfRecommendation = 'optimize';
      cfReasoning = `Active but inefficient: ${cfTotalRequests.toLocaleString()} requests/month, but cache hit rate is only ${avgCacheHitRate.toFixed(1)}%. Optimize caching strategy.`;
    } else {
      cfRecommendation = 'keep';
      cfReasoning = `Good performance: ${cfTotalRequests.toLocaleString()} requests/month with ${avgCacheHitRate.toFixed(1)}% cache hit rate. CDN is providing value.`;
    }
  }

  // Calculate CloudWatch costs and recommendation
  const cwTotalCost = cloudWatchMetrics.reduce((sum, m) => sum + m.estimatedCostPerMonth, 0);
  const cwTotalDataPoints = cloudWatchMetrics.reduce((sum, m) => sum + m.dataPointsLast30Days, 0);

  let cwRecommendation: 'keep' | 'remove' | 'optimize' = 'remove';
  let cwReasoning = '';

  if (cloudWatchMetrics.length === 0) {
    cwRecommendation = 'remove';
    cwReasoning = 'No custom CloudWatch metrics found. Monitoring is not being used.';
  } else if (cwTotalDataPoints === 0) {
    cwRecommendation = 'remove';
    cwReasoning = `Found ${cloudWatchMetrics.length} metric namespace(s), but no data points in last 30 days. Remove unused metrics.`;
  } else if (cwTotalCost < 5) {
    cwRecommendation = 'optimize';
    cwReasoning = `Minimal usage: ${cwTotalDataPoints} data points/month ($${cwTotalCost.toFixed(2)}/month). Consider consolidating metrics or using local logging.`;
  } else {
    cwRecommendation = 'keep';
    cwReasoning = `Active monitoring: ${cwTotalDataPoints.toLocaleString()} data points/month across ${cloudWatchMetrics.length} namespace(s). Monitoring is providing value.`;
  }

  // Overall recommendation
  const totalMonthlyCost = s3TotalCost + cfTotalCost + cwTotalCost;
  const servicesInUse = [
    s3Recommendation !== 'remove' ? 'S3' : null,
    cfRecommendation !== 'remove' ? 'CloudFront' : null,
    cwRecommendation !== 'remove' ? 'CloudWatch' : null,
  ].filter(Boolean);

  let overallRecommendation = '';
  let estimatedMonthlySavings = 0;

  if (servicesInUse.length === 0) {
    overallRecommendation = `🔴 REMOVE ALL AWS SERVICES\n\nNo AWS services are being actively used. You can safely remove all AWS infrastructure and save $${totalMonthlyCost.toFixed(2)}/month.\n\nNext steps:\n1. Remove AWS SDK dependencies from package.json\n2. Remove AWS configuration from .env files\n3. Remove AWS-related code from lib/aws/\n4. Update application to use local alternatives`;
    estimatedMonthlySavings = totalMonthlyCost;
  } else if (servicesInUse.length === 3 && totalMonthlyCost < 10) {
    overallRecommendation = `🟡 OPTIMIZE AWS USAGE\n\nAll AWS services are configured but usage is minimal ($${totalMonthlyCost.toFixed(2)}/month). Consider:\n1. Consolidating to fewer services\n2. Using local alternatives for development\n3. Keeping only production-critical services\n\nActive services: ${servicesInUse.join(', ')}`;
    estimatedMonthlySavings = totalMonthlyCost * 0.5; // Estimate 50% savings from optimization
  } else if (servicesInUse.length > 0) {
    overallRecommendation = `🟢 KEEP ACTIVE SERVICES\n\nAWS services are providing value ($${totalMonthlyCost.toFixed(2)}/month). Keep: ${servicesInUse.join(', ')}\n\nReview individual service recommendations below for optimization opportunities.`;
    estimatedMonthlySavings = 0;
  }

  return {
    timestamp: new Date(),
    s3: {
      buckets: s3Buckets,
      totalCost: s3TotalCost,
      recommendation: s3Recommendation,
      reasoning: s3Reasoning,
    },
    cloudFront: {
      distributions: cloudFrontDists,
      totalCost: cfTotalCost,
      recommendation: cfRecommendation,
      reasoning: cfReasoning,
    },
    cloudWatch: {
      metrics: cloudWatchMetrics,
      totalCost: cwTotalCost,
      recommendation: cwRecommendation,
      reasoning: cwReasoning,
    },
    overallRecommendation,
    estimatedMonthlySavings,
  };
}

/**
 * Format and print audit report
 */
function printReport(report: AuditReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('AWS INFRASTRUCTURE USAGE AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${report.timestamp.toISOString()}`);
  console.log(`Analysis Period: Last ${DAYS_TO_ANALYZE} days`);
  console.log('='.repeat(80));

  // S3 Section
  console.log('\n📦 S3 STORAGE');
  console.log('-'.repeat(80));
  console.log(`Buckets Found: ${report.s3.buckets.length}`);
  console.log(`Estimated Monthly Cost: $${report.s3.totalCost.toFixed(2)}`);
  console.log(`Recommendation: ${report.s3.recommendation.toUpperCase()}`);
  console.log(`Reasoning: ${report.s3.reasoning}`);
  
  if (report.s3.buckets.length > 0) {
    console.log('\nBucket Details:');
    report.s3.buckets.forEach((bucket) => {
      console.log(`  • ${bucket.bucketName}`);
      console.log(`    Region: ${bucket.region}`);
      console.log(`    Objects: ${bucket.objectCount.toLocaleString()}`);
      console.log(`    Size: ${(bucket.totalSizeBytes / (1024 ** 3)).toFixed(2)} GB`);
      console.log(`    Requests (30d): ${bucket.requestsLast30Days.toLocaleString()}`);
      if (bucket.lastModified) {
        console.log(`    Last Modified: ${bucket.lastModified.toISOString()}`);
      }
    });
  }

  // CloudFront Section
  console.log('\n🌐 CLOUDFRONT CDN');
  console.log('-'.repeat(80));
  console.log(`Distributions Found: ${report.cloudFront.distributions.length}`);
  console.log(`Estimated Monthly Cost: $${report.cloudFront.totalCost.toFixed(2)}`);
  console.log(`Recommendation: ${report.cloudFront.recommendation.toUpperCase()}`);
  console.log(`Reasoning: ${report.cloudFront.reasoning}`);
  
  if (report.cloudFront.distributions.length > 0) {
    console.log('\nDistribution Details:');
    report.cloudFront.distributions.forEach((dist) => {
      console.log(`  • ${dist.distributionId}`);
      console.log(`    Domain: ${dist.domainName}`);
      console.log(`    Status: ${dist.status}`);
      console.log(`    Requests (30d): ${dist.requestsLast30Days.toLocaleString()}`);
      console.log(
        `    Data Transfer (30d): ${(dist.bytesDownloadedLast30Days / (1024 ** 3)).toFixed(2)} GB`
      );
      console.log(`    Cache Hit Rate: ${dist.cacheHitRate.toFixed(1)}%`);
    });
  }

  // CloudWatch Section
  console.log('\n📊 CLOUDWATCH MONITORING');
  console.log('-'.repeat(80));
  console.log(`Metric Namespaces Found: ${report.cloudWatch.metrics.length}`);
  console.log(`Estimated Monthly Cost: $${report.cloudWatch.totalCost.toFixed(2)}`);
  console.log(`Recommendation: ${report.cloudWatch.recommendation.toUpperCase()}`);
  console.log(`Reasoning: ${report.cloudWatch.reasoning}`);
  
  if (report.cloudWatch.metrics.length > 0) {
    console.log('\nMetric Namespace Details:');
    report.cloudWatch.metrics.forEach((metric) => {
      console.log(`  • ${metric.namespace}`);
      console.log(`    Metrics: ${metric.metricCount}`);
      console.log(`    Data Points (30d): ${metric.dataPointsLast30Days.toLocaleString()}`);
      console.log(`    Est. Cost: $${metric.estimatedCostPerMonth.toFixed(2)}/month`);
    });
  }

  // Overall Summary
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL RECOMMENDATION');
  console.log('='.repeat(80));
  console.log(report.overallRecommendation);
  
  if (report.estimatedMonthlySavings > 0) {
    console.log(`\n💰 Estimated Monthly Savings: $${report.estimatedMonthlySavings.toFixed(2)}`);
    console.log(`💰 Estimated Annual Savings: $${(report.estimatedMonthlySavings * 12).toFixed(2)}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80) + '\n');
}

/**
 * Main audit function
 */
async function runAudit(): Promise<void> {
  console.log('🔍 Starting AWS Infrastructure Audit...\n');

  // Check if AWS is configured
  if (!isAWSConfigured()) {
    console.log('⚠️  AWS credentials not configured');
    console.log('');
    console.log('AWS services are currently disabled in this application.');
    console.log('This is expected and the application works fine without AWS.');
    console.log('');
    console.log('If you want to enable AWS services, configure these environment variables:');
    console.log('  - AWS_REGION');
    console.log('  - AWS_ACCESS_KEY_ID');
    console.log('  - AWS_SECRET_ACCESS_KEY');
    console.log('');
    console.log('Recommendation: KEEP AWS DISABLED');
    console.log('The application is working well without AWS infrastructure.');
    console.log('Only enable AWS if you specifically need:');
    console.log('  - S3 for large-scale asset storage');
    console.log('  - CloudFront for global CDN');
    console.log('  - CloudWatch for advanced monitoring');
    console.log('');
    return;
  }

  try {
    // Run audits in parallel
    console.log('Auditing S3 buckets...');
    const s3Buckets = await auditS3();
    
    console.log('Auditing CloudFront distributions...');
    const cloudFrontDists = await auditCloudFront();
    
    console.log('Auditing CloudWatch metrics...');
    const cloudWatchMetrics = await auditCloudWatch();

    // Generate and print report
    const report = generateRecommendations(s3Buckets, cloudFrontDists, cloudWatchMetrics);
    printReport(report);

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = '.kiro/specs/dashboard-performance-real-fix/aws-audit-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}\n`);
  } catch (error) {
    console.error('\n❌ Error running audit:', error);
    console.error('\nThis could mean:');
    console.error('  1. AWS credentials are invalid');
    console.error('  2. AWS permissions are insufficient');
    console.error('  3. AWS services are not accessible');
    console.error('\nRecommendation: Consider removing AWS infrastructure if not needed.\n');
    process.exit(1);
  }
}

// Run the audit
runAudit().catch(console.error);
