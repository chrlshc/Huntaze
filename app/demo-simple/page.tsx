export default function DemoSimplePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: 'white', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Demo Simple Page</h1>
      <p style={{ fontSize: '1.5rem' }}>If you see this text, the page is working correctly.</p>
      <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#333', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Test Section</h2>
        <p>This is a test section with basic inline styles.</p>
      </div>
    </div>
  );
}