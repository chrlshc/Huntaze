'use client';

const platforms = [
  {
    name: 'OnlyFans',
    logo: '🔥',
    color: 'from-blue-500 to-blue-600',
    stats: { creators: '12K+', messages: '5.2M+', revenue: '$28M+' }
  },
  {
    name: 'Instagram',
    logo: '📸',
    color: 'from-purple-500 to-pink-500',
    stats: { creators: '8K+', messages: '3.8M+', revenue: '$15M+' }
  },
  {
    name: 'TikTok',
    logo: '🎵',
    color: 'from-gray-900 to-gray-700',
    stats: { creators: '6K+', messages: '2.1M+', revenue: '$8M+' }
  },
  {
    name: 'Reddit',
    logo: '🤖',
    color: 'from-orange-500 to-red-500',
    stats: { creators: '4K+', messages: '1.5M+', revenue: '$6M+' }
  }
];

const StatCard = ({ platform }: { platform: typeof platforms[0] }) => {
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 overflow-hidden group border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      {/* Logo */}
      <div className="text-5xl mb-4">{platform.logo}</div>
      
      {/* Platform name */}
      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{platform.name}</h3>
      
      {/* Stats */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Active Creators</span>
          <span className="font-semibold text-gray-900 dark:text-white">{platform.stats.creators}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Messages Sent</span>
          <span className="font-semibold text-gray-900 dark:text-white">{platform.stats.messages}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Revenue Generated</span>
          <span className="font-semibold text-green-600">{platform.stats.revenue}</span>
        </div>
      </div>
    </div>
  );
};

export default function PlatformStats() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Platform stats grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {platforms.map((platform) => (
            <StatCard key={platform.name} platform={platform} />
          ))}
        </div>

        {/* Bottom section with total stats */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-3xl font-bold mb-6">Total Platform Impact</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">30K+</div>
              <div className="text-purple-100">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">12.6M+</div>
              <div className="text-purple-100">Messages Automated</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$57M+</div>
              <div className="text-purple-100">Revenue Generated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}