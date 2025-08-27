export default function DebugPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Page</h1>
      <h2>Environment Variables:</h2>
      <pre>{JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      }, null, 2)}</pre>
      <h2>Build Info:</h2>
      <p>Next.js Version: {process.env.npm_package_dependencies_next}</p>
      <p>React Version: {process.env.npm_package_dependencies_react}</p>
      <h2>Test API:</h2>
      <p>
        <a href="/api/health">/api/health</a>
      </p>
    </div>
  );
}
