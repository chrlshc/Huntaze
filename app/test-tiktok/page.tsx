import Link from 'next/link';

export default function TestTikTok() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Test TikTok OAuth</h1>
        <Link 
          href="/auth/tiktok" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg hover:opacity-90"
        >
          Connect TikTok Account
        </Link>
        <p className="text-sm text-gray-600">Click the button above to test TikTok OAuth</p>
      </div>
    </div>
  );
}