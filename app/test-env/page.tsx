'use client';

export default function TestEnv() {
  const handleDirectTikTok = () => {
    // Force la redirection avec l'URL ngrok
    const clientKey = 'sbawig5ujktghe109j';
    const redirectUri = encodeURIComponent('https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback');
    const state = Math.random().toString(36).substring(7);
    const scope = 'user.info.basic,video.upload,video.publish';
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test Direct TikTok OAuth</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Environment Check:</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_TIKTOK_REDIRECT_URI: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI,
  NODE_ENV: process.env.NODE_ENV,
}, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="font-semibold mb-2">TikTok OAuth URL:</h2>
            <p className="text-sm text-gray-600 mb-2">Client Key: sbawig5ujktghe109j</p>
            <p className="text-sm text-gray-600 mb-2">Redirect: https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback</p>
          </div>

          <button
            onClick={handleDirectTikTok}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg hover:opacity-90"
          >
            Launch TikTok OAuth Directly
          </button>
        </div>
      </div>
    </div>
  );
}