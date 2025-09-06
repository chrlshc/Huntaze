"use client";

import { motion } from "framer-motion";
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import { Calendar, Clock, ArrowRight, TrendingUp, DollarSign, Brain, Zap, Users, Shield } from "lucide-react";
import Link from "next/link";

const categories = [
  "All",
  "Growth Tips",
  "AI & Automation",
  "Platform Updates",
  "Success Stories",
  "Industry News"
];

const blogPosts = [
  {
    title: "How to 10x Your OnlyFans Revenue with AI in 2024",
    excerpt: "Discover the proven strategies top creators use to scale their income without burnout.",
    category: "Growth Tips",
    author: "Sarah Chen",
    date: "Dec 15, 2024",
    readTime: "5 min read",
    image: "/blog/10x-revenue.jpg",
    slug: "10x-onlyfans-revenue-ai-2024",
    icon: TrendingUp,
    featured: true
  },
  {
    title: "Instagram's New Creator Tools: What You Need to Know",
    excerpt: "Instagram just launched game-changing features for creators. Here's how to use them.",
    category: "Platform Updates",
    author: "Mike Johnson",
    date: "Dec 12, 2024",
    readTime: "3 min read",
    image: "/blog/instagram-update.jpg",
    slug: "instagram-new-creator-tools-2024",
    icon: Zap
  },
  {
    title: "From 0 to $50K/Month: Jessica's Success Story",
    excerpt: "How a college student built a creator empire using AI automation.",
    category: "Success Stories",
    author: "Emma Wilson",
    date: "Dec 10, 2024",
    readTime: "7 min read",
    image: "/blog/success-story.jpg",
    slug: "jessica-50k-success-story",
    icon: DollarSign
  },
  {
    title: "The Psychology of Fan Engagement: What Really Works",
    excerpt: "Science-backed strategies to build deeper connections and increase loyalty.",
    category: "AI & Automation",
    author: "Dr. Alex Martinez",
    date: "Dec 8, 2024",
    readTime: "6 min read",
    image: "/blog/psychology.jpg",
    slug: "psychology-fan-engagement",
    icon: Brain
  },
  {
    title: "TikTok Monetization: Beyond the Creator Fund",
    excerpt: "Unlock hidden revenue streams most TikTok creators don't know about.",
    category: "Growth Tips",
    author: "Lisa Park",
    date: "Dec 5, 2024",
    readTime: "4 min read",
    image: "/blog/tiktok-money.jpg",
    slug: "tiktok-monetization-strategies",
    icon: DollarSign
  },
  {
    title: "Protecting Your Content: A Creator's Security Guide",
    excerpt: "Essential tips to keep your content safe from leaks and piracy.",
    category: "Industry News",
    author: "Security Team",
    date: "Dec 3, 2024",
    readTime: "5 min read",
    image: "/blog/security.jpg",
    slug: "creator-content-security-guide",
    icon: Shield
  }
];

export default function BlogPage() {
  return (
    <>
      <HeaderImproved />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-purple-50 to-white dark:from-gray-950 dark:to-black">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Creator insights &
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                growth strategies
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
              Learn from top creators and industry experts
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-20 z-40">
        <div className="container-width">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all ${
                  index === 0
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12">
        <div className="container-width">
          {blogPosts.filter(post => post.featured).map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-1"
            >
              <div className="bg-white dark:bg-black rounded-3xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-sm">Featured</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      {post.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{post.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{post.readTime}</span>
                      </div>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium hover:gap-3 transition-all"
                    >
                      Read full article
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center">
                      <post.icon className="w-24 h-24 text-purple-600 opacity-20" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20">
        <div className="container-width">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.filter(post => !post.featured).map((post, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image */}
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                      <post.icon className="w-16 h-16 text-purple-600 opacity-20" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-600 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">{post.author}</p>
                            <p className="text-xs text-gray-500">{post.date}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              Load more articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container-width text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get creator insights delivered
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join 50,000+ creators getting exclusive tips, strategies, and industry updates.
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <FooterImproved />
    </>
  );
}