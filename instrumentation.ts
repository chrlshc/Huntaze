// Azure Monitor OpenTelemetry Distro (optional)
// Must be imported BEFORE other app imports to capture telemetry.
// Enable by setting APPINSIGHTS_CONNECTION_STRING.

try {
  const conn = process.env.APPINSIGHTS_CONNECTION_STRING;
  if (conn) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAzureMonitor } = require('@azure/monitor-opentelemetry');
    useAzureMonitor({ connectionString: conn });
  }
} catch {
  // Telemetry optional; ignore if package not present in this env
}

export {};

