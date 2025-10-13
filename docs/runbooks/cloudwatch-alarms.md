# Runbook: CloudWatch Metrics & Alarms

Summary
- Business and runtime metrics for OF worker with alarms to SNS.

Metrics (Namespace: `Huntaze/OFWorker`)
- LoginSuccessCount, LoginFailureCount (Count)
- LoginFailures (Count; compatibility and simple thresholding)
- ActionDurationMs, SessionDurationMs (Milliseconds)
- MemoryUsageMB (Megabytes)
- CircuitOpenedCount / HalfOpen / Closed + CircuitStateChange (Count)

Alarms (provisioned via CDK)
- OFLoginFailuresGt5: `LoginFailures` sum > 5 over 60 minutes → SNS `alerts`.
- OFMemoryUsageHigh: `MemoryUsageMB` max > 7000 over 5 minutes → SNS `alerts`.

Dashboard (CDK)
- Huntaze-OFWorker dashboard with widgets for success/failure counts, action/session latency, and memory usage.

Operations
- Test alarm: manually put metric datapoint or trigger runs to exceed threshold.
- Silence: disable alarm or set `TreatMissingData=notBreaching` (already set).

