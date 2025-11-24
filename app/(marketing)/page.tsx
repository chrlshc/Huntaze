// Exact copy of test-simple that works
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Huntaze Homepage</h1>
      <p>If you see this, the homepage is working.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
