// Simple test page to isolate the 500 error
export const dynamic = 'force-dynamic';

export default function TestSimplePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-sans)' }}>
      <h1>Test Page</h1>
      <p>If you see this, the server is working.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
