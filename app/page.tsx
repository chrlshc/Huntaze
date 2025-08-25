import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { ArrowRight, BarChart3, Shield, Zap, Users, Globe, Heart, Sparkles, Crown, CheckCircle, DollarSign, Star, Trophy, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-12 px-4 md:py-20 lg:py-24 bg-gradient-to-br from-purple-50 via-white to-pink-50 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Trusted by 500+ Top Creators
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 font-bold leading-tight">
                Replace Your Agency with{' '}
                <span className="text-gradient">AI Automation</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed">
                Keep 85-98% of your revenue while our AI manages messages, schedules content, and converts fans 24/7. No more giving away 50-60% to agencies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="btn-primary text-lg px-8 py-6 w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all" aria-label="Start free trial">
                  <Link href="/join">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild className="btn-secondary text-lg px-8 py-6 w-full sm:w-auto" aria-label="Book a demo">
                  <Link href="/demo">Book a Demo</Link>
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free trial (no credit card)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="relative">
                {/* Phone mockup */}
                <div className="mx-auto max-w-sm">
                  <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-[2.5rem] p-2">
                    <div className="bg-black rounded-[2.25rem] p-4">
                      <div className="bg-white rounded-[1.75rem] h-[500px] flex flex-col">
                        {/* Phone header */}
                        <div className="bg-gray-100 rounded-t-[1.75rem] p-4 border-b">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
                            <div>
                              <div className="font-semibold text-sm">AI Assistant</div>
                              <div className="text-xs text-green-500">● Active now</div>
                            </div>
                          </div>
                        </div>
                        {/* Chat messages */}
                        <div className="flex-1 p-4 space-y-3">
                          <div className="bg-purple-100 text-purple-900 p-3 rounded-2xl rounded-tl-sm max-w-[80%]">
                            <p className="text-sm">Hello! Thank you for subscribing to my exclusive content. What type of content interests you most?</p>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-2xl rounded-tr-sm max-w-[80%] ml-auto">
                            <p className="text-sm">I really enjoy your artistic photography</p>
                          </div>
                          <div className="bg-purple-100 text-purple-900 p-3 rounded-2xl rounded-tl-sm max-w-[80%]">
                            <p className="text-sm">Wonderful! I've just released a new artistic collection. I'll send you a preview link with special subscriber pricing.</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <Sparkles className="w-3 h-3" />
                            <span>AI is handling this conversation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating stats */}
                <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 hidden md:block">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-xs text-gray-500">Revenue</div>
                      <div className="font-bold">+285%</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 hidden md:block">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <div>
                      <div className="text-xs text-gray-500">Active Fans</div>
                      <div className="font-bold">2,847</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 md:py-20 px-4 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Active Creators</div>
              <div className="text-sm text-gray-500 mt-1">Growing daily</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">$50M+</div>
              <div className="text-gray-600">Revenue Processed</div>
              <div className="text-sm text-gray-500 mt-1">Last 12 months</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">4.9/5</div>
              <div className="text-gray-600">Creator Rating</div>
              <div className="text-sm text-gray-500 mt-1">200+ reviews</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600">AI Response Time</div>
              <div className="text-sm text-gray-500 mt-1">Never miss a sale</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Creators Choose Huntaze</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of creators who've ditched their agencies and kept millions in revenue
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Save $5k-50k/Month</h3>
              <p className="text-gray-600 mb-4">
                Stop giving away 50-60% to agencies. Our capped commissions mean you keep 85-98% of everything you earn.
              </p>
              <Link href="/pricing" className="text-purple-600 font-medium hover:text-purple-700">
                See pricing breakdown →
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">10x Faster Response Time</h3>
              <p className="text-gray-600 mb-4">
                AI responds in seconds, not hours. Convert more fans while they're hot and ready to spend.
              </p>
              <Link href="/demo" className="text-purple-600 font-medium hover:text-purple-700">
                Watch it in action →
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">100% Safe & Compliant</h3>
              <p className="text-gray-600 mb-4">
                Bank-level security, GDPR compliant, and officially approved by all major platforms.
              </p>
              <Link href="/security" className="text-purple-600 font-medium hover:text-purple-700">
                Learn about security →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Revolutionary Pricing That Scales With You
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Unlike agencies that take 50-60% forever, we use smart commission caps. 
            The more you grow, the less you pay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
              <Link href="/pricing">
                View Pricing Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild className="bg-purple-700 text-white hover:bg-purple-800 text-lg px-8 py-6">
              <Link href="/demo">
                Calculate Your Savings
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Creators Love Huntaze</h2>
            <p className="text-xl text-gray-600">See what our creators say about switching from agencies</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Switched from my agency last month and already saved $12k. The AI responds faster than any human ever did."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-200 rounded-full"></div>
                <div>
                  <div className="font-semibold">Sarah M.</div>
                  <div className="text-sm text-gray-500">$25k/month creator</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "My agency took 50% for copy-paste messages. Huntaze does it better for a fraction of the cost. Game changer!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-200 rounded-full"></div>
                <div>
                  <div className="font-semibold">Emma K.</div>
                  <div className="text-sm text-gray-500">$40k/month creator</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Finally have my life back! Working 2 hours instead of 12, and making more money. Why didn't I switch sooner?"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-200 rounded-full"></div>
                <div>
                  <div className="font-semibold">Jessica R.</div>
                  <div className="text-sm text-gray-500">$15k/month creator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 px-4 md:py-24 lg:py-32 bg-white relative overflow-hidden border-t border-gray-100">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0" style={{backgroundImage: `repeating-linear-gradient(45deg, #9333ea 0, #9333ea 1px, transparent 1px, transparent 15px)`, backgroundSize: '20px 20px'}}></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl mb-4">Everything You Need to <span className="text-gradient">Scale Your OnlyFans</span></h2>
            <p className="text-base md:text-xl text-neutral-700 max-w-3xl mx-auto px-4">
              One platform, endless possibilities. Automate your entire OnlyFans business with our AI-powered suite designed specifically for content creators.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* AI Messaging */}
            <div className="girly-card p-6 md:p-8">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mb-4" aria-hidden="true" />
              <h3 className="mb-3">AI Messaging Assistant</h3>
              <p className="mb-4">
                Never miss a message again. Our AI learns your personality to engage fans 24/7, increasing tips and PPV sales by up to 300%.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Personalized fan conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Smart tip suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">PPV sales optimization</span>
                </li>
              </ul>
            </div>

            {/* Content Scheduling */}
            <div className="girly-card p-6 md:p-8">
              <Crown className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mb-4" aria-hidden="true" />
              <h3 className="mb-3">Smart Content Scheduler</h3>
              <p className="mb-4">
                Post at the perfect time, every time. Our AI analyzes your audience to schedule content when engagement is highest, boosting your visibility.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Optimal posting times</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Multi-platform posting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Content performance tracking</span>
                </li>
              </ul>
            </div>

            {/* Fan Analytics */}
            <div className="girly-card p-6 md:p-8">
              <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mb-4" aria-hidden="true" />
              <h3 className="mb-3">Advanced Fan Analytics</h3>
              <p className="mb-4">
                Know your fans better than ever. Track spending patterns, engagement rates, and preferences to maximize revenue from every subscriber.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Detailed fan insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Revenue predictions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Churn prevention alerts</span>
                </li>
              </ul>
            </div>


            {/* PPV Management */}
            <div className="girly-card p-6 md:p-8">
              <DollarSign className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mb-4" aria-hidden="true" />
              <h3 className="mb-3">PPV & Tip Optimizer</h3>
              <p className="mb-4">
                Maximize your pay-per-view sales and tips with AI-driven pricing strategies. Our system learns what content sells best at what price.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Dynamic pricing optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Automated tip menus</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Revenue maximization</span>
                </li>
              </ul>
            </div>

            {/* Creator Support */}
            <div className="girly-card p-6 md:p-8">
              <Star className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mb-4" aria-hidden="true" />
              <h3 className="mb-3">VIP Creator Support</h3>
              <p className="mb-4">
                You're never alone on your journey. Get 24/7 support from our team of OnlyFans experts who understand the creator economy.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Personal success manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">24/7 live chat support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-neutral-800">Growth strategy sessions</span>
                </li>
              </ul>
            </div>
            
            {/* Next Features - Card 6 */}
            <div className="girly-card p-6 md:p-8">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-purple-600 mb-4" aria-hidden="true" />
              <h3 className="mb-3">Community Driven</h3>
              <p className="mb-4">
                Every Monday, we ask our community to vote on new features. The most requested features get built within 7 days.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">🎥</span>
                  <span className="text-neutral-800">AI Video Scripts <span className="text-sm text-neutral-600">(Week 2)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">📱</span>
                  <span className="text-neutral-800">TikTok Integration <span className="text-sm text-neutral-600">(Week 3)</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">💳</span>
                  <span className="text-neutral-800">Crypto Payments <span className="text-sm text-neutral-600">(Week 4)</span></span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-purple-100">
                <p className="text-sm font-medium text-purple-700 text-center">🗳️ Vote Every Monday</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community-Driven Features Section */}
      <section className="py-20 px-4 md:py-24 lg:py-32 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-50"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">Built by Creators, For Creators</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Innovation <span className="text-gradient bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Continue</span></h2>
            <p className="text-lg md:text-xl text-gray-800 max-w-3xl mx-auto">
              Our platform evolves continuously based on feedback from our community of successful creators.
            </p>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 px-4 md:py-24 lg:py-32 bg-gradient-to-br from-purple-50 via-pink-50 to-white border-t border-purple-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6">Real Results from <span className="text-gradient">Real Creators</span></h2>
              <p className="text-xl text-neutral-700 mb-8">
                Join hundreds of creators who have transformed their OnlyFans into sustainable 6-figure businesses with our AI platform.
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Average Revenue Growth</span>
                    <span className="text-blue-600 font-bold">+285%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Time Saved Daily</span>
                    <span className="text-blue-600 font-bold">+78%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{width: '78%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Fan Engagement Rate</span>
                    <span className="text-pink-600 font-bold">+92%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3">
                    <div className="bg-pink-500 h-3 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-8">
              <Sparkles className="w-16 h-16 text-purple-600 mb-6" />
              <h3 className="mb-4">Why Creators Choose Us</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Zero technical skills required</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Set up in under 5 minutes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>100% secure & private</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime, no lock-in</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="testimonials" className="py-20 px-4 md:py-24 lg:py-32 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl mb-4">Real <span className="text-gradient">Creator Success</span> Stories</h2>
            <p className="text-base md:text-xl text-neutral-700 max-w-3xl mx-auto px-4">
              From part-time creators to 6-figure earners. See how our AI platform transformed their OnlyFans journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="testimonial-card p-6 md:p-8">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
                  <div>
                    <p className="font-semibold">Bella Rose</p>
                    <p className="text-sm text-neutral-700">@bellarose • Top 0.5%</p>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">$45k/month</p>
                <p className="text-neutral-700">From $3k in 3 months</p>
              </div>
              <blockquote className="text-neutral-800 italic mb-4">
                <p>"I was spending 8 hours a day messaging fans. Now the AI handles everything perfectly while I create content. My income went 15x!"</p>
              </blockquote>
              <div className="flex gap-2 text-xs">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">AI Messaging</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">PPV Strategy</span>
              </div>
            </div>
            
            <div className="testimonial-card p-6 md:p-8">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
                  <div>
                    <p className="font-semibold">Luna Sky</p>
                    <p className="text-sm text-neutral-700">@lunasky • Top 1%</p>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">6 hrs → 30 min</p>
                <p className="text-neutral-700">Daily work time</p>
              </div>
              <blockquote className="text-neutral-800 italic mb-4">
                <p>"I'm a single mom and time is precious. The AI responds exactly like I would, handles all my DMs, and I just check in once a day!"</p>
              </blockquote>
              <div className="flex gap-2 text-xs">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Time Freedom</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">AI Assistant</span>
              </div>
            </div>
            
            <div className="testimonial-card p-6 md:p-8">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
                  <div>
                    <p className="font-semibold">Mia Diamond</p>
                    <p className="text-sm text-neutral-700">@miadiamond • Top 0.1%</p>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">$127k/month</p>
                <p className="text-neutral-700">Consistent earnings</p>
              </div>
              <blockquote className="text-neutral-800 italic mb-4">
                <p>"The mass messaging and PPV optimizer doubled my income. I send one campaign and the AI personalizes it for each fan's spending habits!"</p>
              </blockquote>
              <div className="flex gap-2 text-xs">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Mass DMs</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Smart Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/50">
              <Crown className="w-4 h-4 mr-2" />
              Limited Time: First Month Free for Creators Under $1.5k
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Stop Losing 50% to Agencies
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Keep your money. Keep your control. Let AI do the work.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">5 min</div>
              <div className="text-sm text-gray-400">Setup time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">$0</div>
              <div className="text-sm text-gray-400">To get started</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-gray-400">AI working</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-10 py-6 shadow-2xl">
              <Link href="/join">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild className="bg-white/10 backdrop-blur text-white border border-white/20 hover:bg-white/20 text-lg px-10 py-6">
              <Link href="/demo">Watch 2-Min Demo</Link>
            </Button>
          </div>
          
          <p className="mt-8 text-sm text-gray-400">
            No credit card required • Cancel anytime • GDPR compliant
          </p>
        </div>
      </section>
    </div>
  );
}
