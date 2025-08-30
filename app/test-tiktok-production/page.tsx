'use client';

export default function TestTikTokProduction() {
  const testProductionOAuth = () => {
    const clientKey = 'sbawig5ujktghe109j';
    const redirectUri = encodeURIComponent('https://67a080797fc3.ngrok-free.app/auth/tiktok/callback-debug');
    const state = Math.random().toString(36).substring(7);
    const scope = 'user.info.basic';
    
    // Force production URL
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
    
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="elevated-card p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Test TikTok Production OAuth</h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800 mb-2">This uses:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Production URL (www.tiktok.com)</li>
              <li>• Debug callback route</li>
              <li>• Minimal scope (user.info.basic)</li>
            </ul>
          </div>
          
          <button
            onClick={testProductionOAuth}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Test TikTok OAuth (Production)
          </button>
          
          <div className="text-center">
            <a href="/debug-tiktok-connection" className="text-sm text-purple-600 hover:underline">
              Check Connection Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
