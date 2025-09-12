"use client";

export default function TestMockupPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Test Mockup - Mobile View</h1>
      
      {/* Test Mobile Mockup */}
      <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-[22px] border border-white/20 bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden mx-auto">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-sm font-bold text-[#764ba2]">H</div>
              <span className="text-white font-semibold">Huntaze</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-xs text-white font-bold">S</div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome back! 👋</h2>
          
          {/* Revenue Chart */}
          <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/20 mb-4">
            <h3 className="text-white font-semibold mb-3">Today's Revenue</h3>
            <div className="h-24 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-lg mb-3"></div>
            <p className="text-3xl font-bold text-white">$3,847</p>
            <p className="text-green-400 text-sm">↑ +23% from yesterday</p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md p-4 border border-purple-500/20">
              <p className="text-white/70 text-xs">Subscribers</p>
              <p className="text-xl font-bold text-white">4,832</p>
              <span className="text-purple-400 text-xs">+18%</span>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-green-500/20 backdrop-blur-md p-4 border border-blue-500/20">
              <p className="text-white/70 text-xs">Messages</p>
              <p className="text-xl font-bold text-white">147</p>
              <span className="text-blue-400 text-xs">89% AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}