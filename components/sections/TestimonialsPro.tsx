'use client';

import { useState } from 'react';
import { CheckCircle, Star, Quote, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Martinez',
    handle: '@sarahmartinez_',
    role: 'Fashion & Lifestyle Creator',
    avatar: '/testimonials/sarah-martinez.jpg', // Professional headshot
    platform: 'OnlyFans',
    verified: true,
    rating: 5,
    testimonial: "Huntaze literally changed my life. I went from spending 8+ hours a day messaging fans to focusing on content creation. My revenue went from $8k to $45k/month in just 4 months. The AI understands my voice perfectly and my fans love the quick responses!",
    stats: {
      before: '$8,000/mo',
      after: '$45,000/mo',
      timeSaved: '40 hours/week'
    },
    joinedDate: 'March 2024',
    profileUrl: 'https://onlyfans.com/sarahmartinez',
    featured: true
  },
  {
    id: 2,
    name: 'Emma Laurent',
    handle: '@emma.laurent',
    role: 'Fitness & Wellness Coach',
    avatar: '/testimonials/emma-laurent.jpg',
    platform: 'Instagram + OnlyFans',
    verified: true,
    rating: 5,
    testimonial: "As a fitness creator managing multiple platforms, Huntaze saved my sanity. The unified inbox is a game-changer - I can manage all my DMs from one place. My engagement rates are up 300% and I\'m earning more than I ever thought possible.",
    stats: {
      before: '$12,000/mo',
      after: '$62,000/mo',
      timeSaved: '35 hours/week'
    },
    joinedDate: 'February 2024',
    profileUrl: 'https://instagram.com/emma.laurent'
  },
  {
    id: 3,
    name: 'Mia Rodriguez',
    handle: '@miarodriguez.official',
    role: 'Beauty & Skincare Expert',
    avatar: '/testimonials/mia-rodriguez.jpg',
    platform: 'TikTok + Instagram',
    verified: true,
    rating: 5,
    testimonial: "The pricing optimization feature alone paid for my subscription 100x over. Huntaze analyzed my content performance and suggested price points I never would have tried. Best decision I made for my creator business!",
    stats: {
      before: '$5,000/mo',
      after: '$38,000/mo',
      timeSaved: '25 hours/week'
    },
    joinedDate: 'January 2024',
    profileUrl: 'https://tiktok.com/@miarodriguez.official'
  },
  {
    id: 4,
    name: 'Alex Chen',
    handle: '@alexchenfit',
    role: 'Personal Trainer',
    avatar: '/testimonials/alex-chen.jpg',
    platform: 'OnlyFans',
    verified: true,
    rating: 5,
    testimonial: "I was skeptical about AI at first, but Huntaze feels so personal. My subscribers often compliment how attentive I am now. What they don\'t know is that Huntaze helps me manage 1000+ daily messages while I sleep!",
    stats: {
      before: '$15,000/mo',
      after: '$78,000/mo',
      timeSaved: '45 hours/week'
    },
    joinedDate: 'December 2023',
    profileUrl: 'https://onlyfans.com/alexchenfit'
  }
];

export default function TestimonialsPro() {
  const [selectedTestimonial, setSelectedTestimonial] = useState(testimonials[0]);

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
            Loved by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              15,000+ creators
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real creators sharing their success stories. No actors, no scripts, just genuine results.
          </p>
        </div>

        {/* Featured Testimonial */}
        <div className="bg-gray-900 rounded-2xl p-8 lg:p-12 shadow-xl border border-gray-800 mb-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Creator Info */}
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                    {/* Placeholder for real image */}
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl">
                      {selectedTestimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  {selectedTestimonial.verified && (
                    <CheckCircle className="absolute -bottom-1 -right-1 w-6 h-6 text-blue-500 bg-white dark:bg-gray-800 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    {selectedTestimonial.name}
                    <Link 
                      href={selectedTestimonial.profileUrl}
                      className="text-purple-600 hover:text-purple-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </h3>
                  <p className="text-gray-400">{selectedTestimonial.handle}</p>
                  <p className="text-sm text-gray-400">{selectedTestimonial.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {selectedTestimonial.platform}
                    </span>
                    <span className="text-xs text-gray-400">
                      Member since {selectedTestimonial.joinedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial */}
              <div className="relative">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-purple-200" />
                <p className="text-lg text-gray-300 italic pl-6">
                  {selectedTestimonial.testimonial}
                </p>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-6">
                {selectedTestimonial.name.split(' ')[0]}\'s Results
              </h4>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Monthly Revenue</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                      {selectedTestimonial.stats.before}
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      {selectedTestimonial.stats.after}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Time Saved</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedTestimonial.stats.timeSaved}
                  </p>
                </div>
                <div className="pt-4 border-t border-purple-200">
                  <p className="text-sm text-gray-400">
                    ROI in first month:{' '}
                    <span className="font-bold text-white">2,847%</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((testimonial) => (
            <button
              key={testimonial.id}
              onClick={() => setSelectedTestimonial(testimonial)}
              className={`p-6 rounded-xl border text-left transition-all ${
                selectedTestimonial.id === testimonial.id
                  ? 'bg-gray-800 border-purple-500 shadow-lg'
                  : 'bg-gray-900 border-gray-700 hover:border-purple-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-400">{testimonial.platform}</p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {testimonial.stats.before}
                  </p>
                  <span className="text-xs text-gray-600 dark:text-gray-400">→</span>
                  <p className="text-xs font-semibold text-purple-400">
                    {testimonial.stats.after}
                  </p>
                </div>
                <div className="mt-2 h-6">
                  {/* Sparkline growth */}
                  <svg className="w-full h-full" viewBox="0 0 100 20">
                    <path
                      d="M0,18 L20,16 L40,12 L60,8 L80,4 L100,2"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Join thousands of successful creators today
          </p>
          <Link 
            href="/auth"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Start free trial
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}