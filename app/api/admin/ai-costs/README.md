# Admin AI Cost Monitoring Dashboard API

This API provides comprehensive monitoring and analytics for AI usage costs across all creators on the platform.

## Endpoint

```
GET /api/admin/ai-costs
```

## Authentication

**TODO**: This endpoint requires admin authentication. Currently not enforced for development.

## Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startDate` | ISO Date | Filter logs from this date onwards | All time |
| `endDate` | ISO Date | Filter logs up to this date | Now |
| `creatorId` | Number | Filter by specific creator ID | All creators |
| `feature` | String | Filter by feature (messaging, content, analytics, sales) | All features |
| `format` | String | Response format: 'json' or 'csv' | json |
| `limit` | Number | Number of top creators to return | 100 |

## Response Format (JSON)

```typescript
{
  totalSpending: {
    costUsd: number;
    tokensInput: number;
    tokensOutput: number;
  };
  perCreatorBreakdown: Array<{
    creatorId: number;
    email: string;
    name: string | null;
    totalCost: number;
    totalTokens: number;
    byFeature: Record<string, { cost: number; tokens: number }>;
    byAgent: Record<string, { cost: number; tokens: number }>;
  }>;
  highCostCreators: Array<{
    // Same structure as perCreatorBreakdown, sorted by cost
  }>;
  anomalies: Array<{
    type: 'high_spending' | 'feature_concentration';
    creatorId: number;
    email: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  metadata: {
    period: {
      start: string;
      end: string;
    };
    filters: {
      creatorId: string;
      feature: string;
    };
    recordCount: number;
  };
}
```

## Examples

### Get all-time spending

```bash
curl http://localhost:3000/api/admin/ai-costs
```

### Get spending for a specific period

```bash
curl "http://localhost:3000/api/admin/ai-costs?startDate=2024-01-01&endDate=2024-01-31"
```

### Get spending for a specific creator

```bash
curl "http://localhost:3000/api/admin/ai-costs?creatorId=123"
```

### Filter by feature

```bash
curl "http://localhost:3000/api/admin/ai-costs?feature=messaging"
```

### Export to CSV

```bash
curl "http://localhost:3000/api/admin/ai-costs?format=csv" > ai-costs.csv
```

### Get top 10 highest spenders

```bash
curl "http://localhost:3000/api/admin/ai-costs?limit=10"
```

## Features

### 1. Total Spending Aggregation (Requirement 8.1)

Returns the sum of all AI costs across all creators for the specified period.

### 2. Per-Creator Breakdown (Requirement 8.2)

Provides detailed breakdown of spending by:
- Feature (messaging, content, analytics, sales)
- Agent (specific AI agent used)
- Total tokens consumed

### 3. High-Cost Creator Ranking (Requirement 8.3)

Returns creators sorted by total spending, limited to top N creators.

### 4. Anomaly Detection (Requirement 8.3)

Automatically detects:
- **High Spending**: Creators spending > 2 standard deviations above average
- **Feature Concentration**: Creators with > 80% spending on a single feature

### 5. CSV Export (Requirement 8.5)

Export all data to CSV format for further analysis in Excel or other tools.

## Anomaly Detection

The system automatically flags unusual patterns:

- **High Spending Anomalies**: Triggered when a creator's spending is significantly above the platform average
- **Feature Concentration**: Triggered when a creator uses one feature disproportionately

Severity levels:
- **Low**: Minor anomaly, informational
- **Medium**: Moderate anomaly, should be reviewed
- **High**: Severe anomaly, requires immediate attention

## CSV Format

The CSV export includes the following columns:

```
Creator ID, Email, Name, Total Cost (USD), Total Tokens, Features, Agents
```

Features and Agents columns contain semicolon-separated lists of feature/agent names with their costs.

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch AI costs"
}
```

## Implementation Notes

- Uses Prisma aggregation for efficient database queries
- Implements Property 27: Total spending aggregation
- Implements Property 28: Per-creator breakdown accuracy
- All costs are in USD with 6 decimal places precision
- Anomaly detection uses statistical methods (standard deviation)

## Future Enhancements

- [ ] Add admin authentication middleware
- [ ] Implement real-time alerting for anomalies
- [ ] Add time-series data for trend analysis
- [ ] Support for custom date ranges (last 7 days, last 30 days, etc.)
- [ ] Integration with monitoring dashboards (Grafana, CloudWatch)
- [ ] Email reports for daily/weekly summaries
