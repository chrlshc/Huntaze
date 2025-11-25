'use client';

export function DashboardMockSection() {
  return (
    <section 
      id="dashboard"
      className="relative min-h-screen flex items-center justify-center px-4 py-16 md:py-24 md:px-6 bg-[#131316] overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-6xl w-full">
        {/* Section Title */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See it in action
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Get a glimpse of your future dashboard. Everything you need to run your creator business, all in one place.
          </p>
        </div>

        {/* Dashboard Visual */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl transition-transform duration-500 hover:scale-[1.01] motion-reduce:transition-none motion-reduce:hover:transform-none">
          {/* Purple glow shadow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-violet-600/20 rounded-2xl blur-xl opacity-50" />
          
          {/* Dashboard placeholder */}
          <div className="relative rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <svg 
                  className="h-8 w-8 text-purple-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Dashboard Preview</p>
              <p className="text-gray-600 text-xs mt-1">Coming soon in beta</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
