/**
 * CloudWatch custom metrics helper. Safe in local/dev environments
 * where the AWS SDK may not be configured.
 */

type AnyRecord = Record<string, unknown>

type StandardUnitValue =
  | 'Seconds'
  | 'Microseconds'
  | 'Milliseconds'
  | 'Bytes'
  | 'Kilobytes'
  | 'Megabytes'
  | 'Gigabytes'
  | 'Terabytes'
  | 'Bits'
  | 'Kilobits'
  | 'Megabits'
  | 'Gigabits'
  | 'Terabits'
  | 'Percent'
  | 'Count'
  | 'Bytes/Second'
  | 'Kilobytes/Second'
  | 'Megabytes/Second'
  | 'Gigabytes/Second'
  | 'Terabytes/Second'
  | 'Bits/Second'
  | 'Kilobits/Second'
  | 'Megabits/Second'
  | 'Gigabits/Second'
  | 'Terabits/Second'
  | 'Count/Second'
  | 'None'

export const StandardUnit: Record<string, StandardUnitValue> = {
  Count: 'Count',
  Milliseconds: 'Milliseconds',
  None: 'None',
}

export interface MetricDimensions {
  Environment?: string
  Service?: string
  Operation?: string
  Status?: string
  [key: string]: string | undefined
}

type MetricInput = {
  MetricName: string
  Timestamp?: Date
  Value?: number
  Unit?: StandardUnitValue
  Dimensions?: Array<{ Name: string; Value: string }>
  StatisticValues?: {
    SampleCount: number
    Sum: number
    Minimum: number
    Maximum: number
  }
}

type MetricDatum = AnyRecord

type PutMetricDataCommandInput = AnyRecord

function safeRequire<T = unknown>(id: string): T | null {
  try {
    // eslint-disable-next-line no-eval
    const req = eval('require') as (moduleId: string) => unknown
    return req(id) as T
  } catch {
    return null
  }
}

const cwSdk = safeRequire<typeof import('@aws-sdk/client-cloudwatch')>('@aws-sdk/client-cloudwatch')
const CloudWatchClient = cwSdk?.CloudWatchClient
const PutMetricDataCommand = cwSdk?.PutMetricDataCommand

const cloudwatch = CloudWatchClient
  ? new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' })
  : null

const NAMESPACE = 'Huntaze/Application'

class MetricCollector {
  private metrics: MetricDatum[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly maxBatchSize = 20
  private readonly flushIntervalMs = 60_000

  constructor() {
    this.startAutoFlush()
  }

  addMetric(metricName: string, value: number, unit: StandardUnitValue, dimensions?: MetricDimensions) {
    this.metrics.push({
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: this.toDimensions(dimensions),
    })

    if (this.metrics.length >= this.maxBatchSize) {
      void this.flush()
    }
  }

  addStatistic(metricName: string, values: number[], unit: StandardUnitValue, dimensions?: MetricDimensions) {
    if (!values.length) return

    const sum = values.reduce((acc, v) => acc + v, 0)
    const min = Math.min(...values)
    const max = Math.max(...values)

    const metric: MetricInput = {
      MetricName: metricName,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: this.toDimensions(dimensions),
      StatisticValues: {
        SampleCount: values.length,
        Sum: sum,
        Minimum: min,
        Maximum: max,
      },
    }

    this.metrics.push(metric)

    if (this.metrics.length >= this.maxBatchSize) {
      void this.flush()
    }
  }

  async flush() {
    if (!this.metrics.length || !cloudwatch || !PutMetricDataCommand) return

    const payload: PutMetricDataCommandInput = {
      Namespace: NAMESPACE,
      MetricData: [...this.metrics],
    }

    this.metrics = []

    try {
      await cloudwatch.send(new PutMetricDataCommand(payload))
    } catch (error) {
      console.error('[monitoring] Failed to publish metrics', error)
    }
  }

  async stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    await this.flush()
  }

  private toDimensions(dimensions?: MetricDimensions) {
    const base: MetricDimensions = {
      Environment: process.env.NODE_ENV || 'development',
      Service: process.env.MONITORING_SERVICE || 'api',
    }

    const merged = { ...base, ...dimensions }
    return Object.entries(merged)
      .filter(([, value]) => value !== undefined)
      .map(([Name, Value]) => ({ Name, Value: Value as string }))
  }

  private startAutoFlush() {
    if (this.flushInterval) return
    this.flushInterval = setInterval(() => {
      void this.flush()
    }, this.flushIntervalMs)
    this.flushInterval.unref?.()
  }
}

const collector = new MetricCollector()

export function trackAPIRequest(endpoint: string, method: string, statusCode: number, duration: number) {
  collector.addMetric('APIRequests', 1, StandardUnit.Count, {
    Endpoint: endpoint,
    Method: method,
    StatusCode: statusCode.toString(),
    StatusCategory: statusCode < 400 ? 'Success' : 'Error',
  })

  collector.addMetric('APIRequestDuration', duration, StandardUnit.Milliseconds, {
    Endpoint: endpoint,
    Method: method,
  })
}

export function trackAIUsage(model: string, operation: string, tokens: number, cost: number, duration: number) {
  collector.addMetric('AITokensUsed', tokens, StandardUnit.Count, { Model: model, Operation: operation })
  collector.addMetric('AICost', cost, StandardUnit.None, { Model: model, Operation: operation })
  collector.addMetric('AIRequestDuration', duration, StandardUnit.Milliseconds, { Model: model, Operation: operation })
}

export function trackMessage(type: 'sent' | 'received' | 'failed', platform = 'onlyfans', metadata?: Record<string, string>) {
  collector.addMetric('Messages', 1, StandardUnit.Count, { Type: type, Platform: platform, ...metadata })
}

export function trackPatternCache(hit: boolean, tier: string, savedCost?: number) {
  collector.addMetric('PatternCache', 1, StandardUnit.Count, { Result: hit ? 'Hit' : 'Miss', Tier: tier })
  if (hit && savedCost) {
    collector.addMetric('PatternCacheSavings', savedCost, StandardUnit.None, { Tier: tier })
  }
}

export function trackQueue(queueName: string, operation: 'enqueue' | 'dequeue' | 'error', count = 1) {
  collector.addMetric('QueueOperations', count, StandardUnit.Count, { Queue: queueName, Operation: operation })
}

export function trackDatabase(operation: string, table: string, duration: number, success: boolean) {
  collector.addMetric('DatabaseOperations', 1, StandardUnit.Count, {
    Operation: operation,
    Table: table,
    Status: success ? 'Success' : 'Error',
  })

  collector.addMetric('DatabaseDuration', duration, StandardUnit.Milliseconds, {
    Operation: operation,
    Table: table,
  })
}

export function trackRevenue(amount: number, source: string, currency = 'USD') {
  collector.addMetric('Revenue', amount, StandardUnit.None, { Source: source, Currency: currency })
}

export function trackCustomMetric(name: string, value: number, unit: StandardUnitValue, dimensions?: MetricDimensions) {
  collector.addMetric(name, value, unit, dimensions)
}

export function trackStatistics(name: string, values: number[], unit: StandardUnitValue, dimensions?: MetricDimensions) {
  collector.addStatistic(name, values, unit, dimensions)
}

export async function flushMetrics() {
  await collector.flush()
}

export async function shutdownMetrics() {
  await collector.stop()
}

process.on('SIGINT', () => {
  void shutdownMetrics()
})
process.on('SIGTERM', () => {
  void shutdownMetrics()
})
