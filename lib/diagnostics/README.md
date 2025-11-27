# Performance Diagnostic Tool

A comprehensive tool for measuring and analyzing real performance bottlenecks in the Huntaze dashboard.

## Overview

This diagnostic tool measures four key performance areas:

1. **Database Query Times** - Tracks execution time of all DB queries
2. **Render Times** - Measures server-side and client-side render performance
3. **Duplicate Requests** - Identifies API endpoints called multiple times
4. **Monitoring Overhead** - Measures the performance impact of monitoring itself

## Quick Start

```typescript
import { performanceDiagnostic } from '@/lib/diagnostics';

// Start diagnostic session
performanceDiagnostic.start();

// ... your application code runs ...

// Stop and get report
const report = performanceDiagnostic.stop();
console.log(performanceDiagnostic.formatReport(report));
```

## Usage

### Basic Usage

```typescript
import { performanceDiagnostic } from '@/lib/diagnostics';

// Start measuring
performanceDiagnostic.start();

// Set current page for request tracking
performanceDiagnostic.setCurrentPage('/dashboard');

// Your code runs here...

// Generate report
const report = performanceDiagnostic.stop();
```

### Database Query Tracking

To track Prisma queries, add the middleware to your Prisma client:

```typescript
import { PrismaClient } from '@prisma/client';
import { createPrismaQueryMiddleware } from '@/lib/diagnostics';

const prisma = new PrismaClient();

// Add middleware
prisma.$use(createPrismaQueryMiddleware());
```

### Render Time Tracking

Track component render times with the HOC:

```typescript
import { withRenderTracking } from '@/lib/diagnostics';

const MyComponent = () => {
  return <div>Hello</div>;
};

export default withRenderTracking(MyComponent, 'MyComponent', '/dashboard');
```

### Request Tracking

Use the tracked fetch wrapper:

```typescript
import { trackedFetch } from '@/lib/diagnostics';

const response = await trackedFetch('/api/content');
```

### Monitoring Overhead Tracking

Track monitoring code overhead:

```typescript
import { monitoringOverheadTracker } from '@/lib/diagnostics';

// Wrap monitoring code
monitoringOverheadTracker.trackMonitoringCall(() => {
  // Your monitoring code here
});
```

## API Reference

### PerformanceDiagnostic

Main diagnostic tool class.

#### Methods

- `start()` - Start diagnostic session
- `stop()` - Stop session and generate report
- `generateReport()` - Generate report from current data
- `formatReport(report)` - Format report as string
- `reset()` - Reset all trackers
- `isActive()` - Check if diagnostic is running
- `setCurrentPage(page)` - Set current page for request tracking
- `measureDatabaseQueries()` - Get database query stats
- `measureRenderTimes()` - Get render time stats
- `findDuplicateRequests()` - Get duplicate request list
- `measureMonitoringOverhead()` - Get monitoring overhead metrics

### DiagnosticReport

Report structure returned by `stop()` and `generateReport()`.

```typescript
interface DiagnosticReport {
  timestamp: Date;
  environment: string;
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  estimatedImpact: ImpactEstimate;
  rawMetrics: {
    database: QueryStats;
    rendering: RenderStats;
    requests: RequestStats;
    monitoring: OverheadMetrics;
  };
}
```

### Bottleneck

Identified performance bottleneck.

```typescript
interface Bottleneck {
  type: 'db' | 'render' | 'network' | 'monitoring';
  description: string;
  impact: 'high' | 'medium' | 'low';
  currentTime: number; // ms
  location: string;
  recommendation: string;
}
```

### Recommendation

Optimization recommendation.

```typescript
interface Recommendation {
  priority: number; // 1-10
  title: string;
  description: string;
  estimatedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}
```

## Testing

Run the test script:

```bash
npm run test:diagnostic
# or
tsx scripts/test-diagnostic-tool.ts
```

## Integration with Dashboard

### API Route Example

```typescript
// app/api/diagnostics/route.ts
import { performanceDiagnostic } from '@/lib/diagnostics';

export async function GET() {
  const report = performanceDiagnostic.generateReport();
  return Response.json(report);
}

export async function POST(request: Request) {
  const { action } = await request.json();

  if (action === 'start') {
    performanceDiagnostic.start();
    return Response.json({ status: 'started' });
  } else if (action === 'stop') {
    const report = performanceDiagnostic.stop();
    return Response.json(report);
  } else if (action === 'reset') {
    performanceDiagnostic.reset();
    return Response.json({ status: 'reset' });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
```

### Dashboard Page Example

```typescript
// app/(app)/diagnostics/page.tsx
'use client';

import { useState } from 'react';
import { DiagnosticReport } from '@/lib/diagnostics';

export default function DiagnosticsPage() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startDiagnostic = async () => {
    await fetch('/api/diagnostics', {
      method: 'POST',
      body: JSON.stringify({ action: 'start' }),
    });
    setIsRunning(true);
  };

  const stopDiagnostic = async () => {
    const response = await fetch('/api/diagnostics', {
      method: 'POST',
      body: JSON.stringify({ action: 'stop' }),
    });
    const data = await response.json();
    setReport(data);
    setIsRunning(false);
  };

  return (
    <div>
      <h1>Performance Diagnostics</h1>
      <button onClick={startDiagnostic} disabled={isRunning}>
        Start Diagnostic
      </button>
      <button onClick={stopDiagnostic} disabled={!isRunning}>
        Stop & Generate Report
      </button>

      {report && (
        <div>
          <h2>Bottlenecks</h2>
          {report.bottlenecks.map((b, i) => (
            <div key={i}>
              <strong>[{b.impact}]</strong> {b.description}
              <br />
              Time: {b.currentTime.toFixed(2)}ms
              <br />
              Location: {b.location}
            </div>
          ))}

          <h2>Recommendations</h2>
          {report.recommendations.map((r, i) => (
            <div key={i}>
              <strong>Priority {r.priority}:</strong> {r.title}
              <br />
              {r.description}
              <br />
              Estimated: {r.estimatedImprovement}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Run in Production-Like Environment** - Test with realistic data and load
2. **Measure Multiple Times** - Run diagnostic multiple times to get consistent results
3. **Focus on High Impact** - Prioritize fixing high-impact bottlenecks first
4. **Measure Before/After** - Always measure impact of optimizations
5. **Don't Run in Production** - This tool adds overhead, use only in development/staging

## Thresholds

Default thresholds for identifying bottlenecks:

- **Slow Query**: > 100ms
- **Slow Render**: > 500ms
- **High Monitoring Overhead**: > 10ms per request
- **High Impact**: Total time > 1000ms or avg time > 500ms
- **Medium Impact**: Total time > 500ms or avg time > 200ms

You can adjust these thresholds:

```typescript
import { dbQueryTracker, renderTimeTracker } from '@/lib/diagnostics';

dbQueryTracker.setSlowQueryThreshold(200); // 200ms
renderTimeTracker.setSlowRenderThreshold(1000); // 1000ms
```

## Troubleshooting

### No queries tracked

Make sure you've added the Prisma middleware:

```typescript
prisma.$use(createPrismaQueryMiddleware());
```

### No requests tracked

Use `trackedFetch` instead of regular `fetch`, or manually track requests:

```typescript
import { requestTracker } from '@/lib/diagnostics';

requestTracker.trackRequest('/api/endpoint', duration);
```

### Memory issues

Reset trackers periodically if running for extended periods:

```typescript
performanceDiagnostic.reset();
```

## License

MIT
