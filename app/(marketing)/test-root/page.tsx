// Test page at root level
export const dynamic = 'force-dynamic';

export default function TestRootPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Root Page</h1>
      <p>This page is at the marketing root level</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
