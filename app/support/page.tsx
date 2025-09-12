'use client'

import { useState } from 'react'
import HeaderMinimal from '@/src/components/header-minimal'
import FooterImproved from '@/src/components/footer-improved'
import Link from 'next/link'

export default function SupportFundingPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('support')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <main className="bg-[#0A0B0C] text-white antialiased">
      <HeaderMinimal />
      
      <div className="pt-[80px] pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.2] pb-6">
              Support & Funding
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl">
              Get the support you need to grow and access exclusive funding opportunities designed for digital creators.
            </p>
          </div>

          <div className="flex gap-2 mb-12">
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'support'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              24/7 Support
            </button>
            <button
              onClick={() => setActiveTab('funding')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'funding'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Creator Funding
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'community'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Community
            </button>
          </div>

          {activeTab === 'support' && (
            <div className="space-y-8">
              <div className="bg-[#111213] rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-8">24/7 Creator Support</h2>
                
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
                    <p className="text-gray-400">Get instant help from our support team, available 24/7 in multiple languages.</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Video Support</h3>
                    <p className="text-gray-400">Schedule one-on-one video calls with experts for personalized assistance.</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Account Protection</h3>
                    <p className="text-gray-400">Dedicated team to help recover accounts and resolve platform issues.</p>
                  </div>
                </div>

                <div className="bg-[#1A1B1D] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Priority Support Tiers</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#111213] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Basic: 24-hour response time</span>
                      </div>
                      <span className="text-gray-500">Free</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#111213] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Pro: 2-hour response time</span>
                      </div>
                      <span className="text-gray-500">Included</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#111213] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>VIP: Instant priority support</span>
                      </div>
                      <span className="text-gray-500">Top earners</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#111213] rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Common Support Topics</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('account')}
                    className="w-full flex items-center justify-between p-4 bg-[#1A1B1D] rounded-lg hover:bg-[#202124] transition-colors"
                  >
                    <span className="font-medium">Account & Security</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedSection === 'account' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === 'account' && (
                    <div className="pl-4 pb-4 text-gray-400">
                      <ul className="space-y-2">
                        <li>• Two-factor authentication setup</li>
                        <li>• Account recovery assistance</li>
                        <li>• Privacy settings optimization</li>
                        <li>• Suspicious activity reporting</li>
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => toggleSection('payments')}
                    className="w-full flex items-center justify-between p-4 bg-[#1A1B1D] rounded-lg hover:bg-[#202124] transition-colors"
                  >
                    <span className="font-medium">Payments & Withdrawals</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedSection === 'payments' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === 'payments' && (
                    <div className="pl-4 pb-4 text-gray-400">
                      <ul className="space-y-2">
                        <li>• Payment method verification</li>
                        <li>• Withdrawal troubleshooting</li>
                        <li>• Currency conversion questions</li>
                        <li>• Tax documentation support</li>
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => toggleSection('content')}
                    className="w-full flex items-center justify-between p-4 bg-[#1A1B1D] rounded-lg hover:bg-[#202124] transition-colors"
                  >
                    <span className="font-medium">Content & Platform Issues</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedSection === 'content' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSection === 'content' && (
                    <div className="pl-4 pb-4 text-gray-400">
                      <ul className="space-y-2">
                        <li>• Content restoration requests</li>
                        <li>• Platform policy guidance</li>
                        <li>• Appeal submission help</li>
                        <li>• Copyright dispute resolution</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funding' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-purple-500/20">
                <h2 className="text-3xl font-bold mb-4">Creator Capital Fund</h2>
                <p className="text-lg text-gray-300 mb-8">
                  Access up to $500,000 in funding to grow your content business. No equity required.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Funding Options</h3>
                    <div className="space-y-4">
                      <div className="bg-[#111213] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Starter Capital</span>
                          <span className="text-purple-400">$5K - $25K</span>
                        </div>
                        <p className="text-sm text-gray-400">For creators earning $1K+ monthly</p>
                      </div>
                      <div className="bg-[#111213] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Growth Capital</span>
                          <span className="text-purple-400">$25K - $100K</span>
                        </div>
                        <p className="text-sm text-gray-400">For creators earning $10K+ monthly</p>
                      </div>
                      <div className="bg-[#111213] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Scale Capital</span>
                          <span className="text-purple-400">$100K - $500K</span>
                        </div>
                        <p className="text-sm text-gray-400">For creators earning $50K+ monthly</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4">How It Works</h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</div>
                        <div>
                          <p className="font-medium">Apply in minutes</p>
                          <p className="text-sm text-gray-400">Connect your platforms for instant verification</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</div>
                        <div>
                          <p className="font-medium">Get approved in 48 hours</p>
                          <p className="text-sm text-gray-400">AI-powered underwriting based on your data</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</div>
                        <div>
                          <p className="font-medium">Repay from future earnings</p>
                          <p className="text-sm text-gray-400">Fixed percentage of revenue, no hidden fees</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>

                <button className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors">
                  Check Eligibility
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#111213] rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Equipment Financing</h3>
                  <p className="text-gray-400 mb-4">
                    Finance cameras, lighting, and studio equipment with 0% APR for qualified creators.
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                    Learn more →
                  </button>
                </div>
                <div className="bg-[#111213] rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Emergency Fund</h3>
                  <p className="text-gray-400 mb-4">
                    Access emergency funds within 24 hours for urgent situations or opportunities.
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                    Learn more →
                  </button>
                </div>
                <div className="bg-[#111213] rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Investment Matching</h3>
                  <p className="text-gray-400 mb-4">
                    We match up to 10% of your content investments to accelerate your growth.
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                    Learn more →
                  </button>
                </div>
              </div>

              <div className="bg-[#111213] rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6">Success Stories</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#1A1B1D] rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full"></div>
                      <div>
                        <p className="font-medium">Sarah M.</p>
                        <p className="text-sm text-gray-400">Fashion Creator</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">
                      "The $50K funding helped me launch my own clothing line. Revenue increased 400% in 6 months."
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">Funded: $50,000</span>
                      <span className="text-green-400">ROI: 400%</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#1A1B1D] rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full"></div>
                      <div>
                        <p className="font-medium">Alex K.</p>
                        <p className="text-sm text-gray-400">Gaming Creator</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">
                      "Used the capital to upgrade my studio setup. Now earning 3x more with better content quality."
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">Funded: $25,000</span>
                      <span className="text-green-400">ROI: 300%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="space-y-8">
              <div className="bg-[#111213] rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-8">Creator Community</h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Exclusive Network</h3>
                    <p className="text-gray-400 mb-6">
                      Join a vetted community of successful creators. Share strategies, collaborate on content, and grow together.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Private Discord server with 10,000+ creators</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Weekly mastermind calls by niche</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Local meetups in 50+ cities</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Learning Hub</h3>
                    <p className="text-gray-400 mb-6">
                      Access exclusive courses, workshops, and mentorship from top creators who've built 7-figure businesses.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1A1B1D] rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-400">200+</p>
                        <p className="text-sm text-gray-400">Video Courses</p>
                      </div>
                      <div className="bg-[#1A1B1D] rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">50+</p>
                        <p className="text-sm text-gray-400">Live Workshops</p>
                      </div>
                      <div className="bg-[#1A1B1D] rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">1-on-1</p>
                        <p className="text-sm text-gray-400">Mentorship</p>
                      </div>
                      <div className="bg-[#1A1B1D] rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-400">24/7</p>
                        <p className="text-sm text-gray-400">Community</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
                  <h3 className="text-lg font-semibold mb-2">Huntaze Creator Summit 2024</h3>
                  <p className="text-gray-400 mb-4">
                    Join us in Miami for 3 days of learning, networking, and exclusive announcements.
                  </p>
                  <button className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                    Reserve your spot →
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#111213] rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Collaboration Tools</h3>
                  <p className="text-gray-400 mb-4">
                    Find creators to collaborate with, split revenue automatically.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">New</span>
                    <span className="text-sm text-gray-500">Coming Q1 2024</span>
                  </div>
                </div>
                <div className="bg-[#111213] rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Creator Directory</h3>
                  <p className="text-gray-400 mb-4">
                    Get discovered by brands and other creators for partnerships.
                  </p>
                  <div className="text-sm text-gray-500">
                    <span className="text-green-400">2,500+</span> active listings
                  </div>
                </div>
                <div className="bg-[#111213] rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Success Coaching</h3>
                  <p className="text-gray-400 mb-4">
                    Weekly group coaching calls with creators earning $100K+ monthly.
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                    Join next session →
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get the support you deserve?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of creators who trust Huntaze for growth and support.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/get-started"
                className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
              <button className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors">
                Talk to Team
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <FooterImproved />
    </main>
  )
}
