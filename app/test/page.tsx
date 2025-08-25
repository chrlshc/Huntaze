export default function TestPage() {
  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '48px', textAlign: 'center', marginTop: '50px' }}>
        TEST HUNTAZE
      </h1>
      <p style={{ color: 'blue', fontSize: '24px', textAlign: 'center' }}>
        Si vous voyez ce texte, Next.js fonctionne !
      </p>
      <div style={{ background: 'yellow', padding: '20px', margin: '20px' }}>
        <p>Test sans Tailwind CSS</p>
      </div>
    </div>
  );
}