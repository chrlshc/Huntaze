import React from 'react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeaturesGridProps {
  features: Feature[];
}

export function FeaturesGrid({ features }: FeaturesGridProps) {
  return (
    <section id="features" className="py-24 px-4 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 opacity-0 animate-fade-in-up">
            <span className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Everything You Need
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-200">
            Powerful tools designed to help creators succeed in the digital age
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              {/* Icon container with gradient background */}
              <div className="w-14 h-14 mb-5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full filter blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
