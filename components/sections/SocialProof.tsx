'use client';

export default function SocialProof() {
  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Top 0.5% Creator',
      image: '/images/avatar1.jpg',
      quote: 'Huntaze helped me go from $3K to $45K/month in just 6 months!'
    },
    {
      name: 'Jessica L.',
      role: 'Fashion Model',
      image: '/images/avatar2.jpg',
      quote: 'The AI saves me 20+ hours per week. I can focus on creating content!'
    },
    {
      name: 'Amanda R.',
      role: 'Fitness Influencer',
      image: '/images/avatar3.jpg',
      quote: 'Best investment I made. Revenue up 400% with half the work.'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4">
        {/* Main counter - NO ANIMATION */}
        <div className="text-center mb-16">
          <p className="text-xl text-gray-400 mb-4">
            Thousands of creators have collectively generated over
          </p>
          <div className="text-6xl lg:text-8xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              $50,000,000
            </span>
          </div>
          <p className="text-xl text-gray-400">with Huntaze</p>
        </div>

        {/* Stats grid - NO ANIMATION */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              10,000+
            </div>
            <div className="text-gray-400">Active Creators</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              25,000,000+
            </div>
            <div className="text-gray-400">Messages Sent</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              312%
            </div>
            <div className="text-gray-400">Avg Revenue Increase</div>
          </div>
        </div>

        {/* Testimonials - NO ANIMATION */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-300 italic">"{testimonial.quote}"</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}