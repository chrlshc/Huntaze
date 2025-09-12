export const dynamic = 'force-dynamic';

export default function DebugScreenshotPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start py-16 px-4">
      <h1 className="hero-title" style={{ color: '#fff' }}>Local Screenshot Preview</h1>
      <p className="hero-subtitle" style={{ marginTop: 8 }}>
        Serving from <code>/api/debug/screenshot</code>. You can override the file using <code>LOCAL_SCREENSHOT_PATH</code>
        in your <code>.env.local</code> or pass a base64 path via <code>?p=</code>.
      </p>
      <div style={{ marginTop: 24, width: '100%', maxWidth: 1200 }}>
        <img
          src={`/api/debug/screenshot?ts=${Date.now()}`}
          alt="Local screenshot"
          style={{ width: '100%', height: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>
    </div>
  );
}

