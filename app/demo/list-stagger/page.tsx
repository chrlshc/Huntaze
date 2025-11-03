'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Star, Heart, MessageCircle, Share2 } from 'lucide-react';
import Link from 'next/link';
import {
  staggerContainer,
  fastStaggerContainer,
  slowStaggerContainer,
  fadeUpItem,
  subtleFadeUpItem,
  fadeInLeftItem,
  fadeInRightItem,
  scaleItem,
  gridStaggerContainer,
} from '@/lib/animations/staggerVariants';

/**
 * List Stagger Animations Demo
 * 
 * Demonstrates various stagger animation patterns for lists.
 * Requirements: 4.4
 */

const sampleItems = [
  { id: 1, title: 'First Item', description: 'This is the first item' },
  { id: 2, title: 'Second Item', description: 'This is the second item' },
  { id: 3, title: 'Third Item', description: 'This is the third item' },
  { id: 4, title: 'Fourth Item', description: 'This is the fourth item' },
  { id: 5, title: 'Fifth Item', description: 'This is the fifth item' },
];

const socialPosts = [
  { id: 1, author: 'Alice', content: 'Just launched my new project!', likes: 42, comments: 8 },
  { id: 2, author: 'Bob', content: 'Amazing sunset today 🌅', likes: 156, comments: 23 },
  { id: 3, author: 'Charlie', content: 'New blog post is live', likes: 89, comments: 12 },
  { id: 4, author: 'Diana', content: 'Coffee and code ☕', likes: 234, comments: 45 },
];

export default function ListStaggerDemo() {
  return (
    <div className="min-h-screen bg-theme-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/demo/button-interactions"
            className="p-2 rounded-lg hover:bg-theme-border/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-theme-text" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-theme-text">List Stagger Animations</h1>
            <p className="text-theme-muted mt-1">
              Reusable stagger variants with 100ms delay
            </p>
          </div>
        </div>

        {/* Standard Stagger (100ms) */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            Standard Stagger (100ms delay)
          </h2>
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {sampleItems.map((item) => (
              <motion.li
                key={item.id}
                variants={fadeUpItem}
                className="p-4 bg-theme-bg rounded-lg border border-theme-border"
              >
                <h3 className="font-medium text-theme-text">{item.title}</h3>
                <p className="text-sm text-theme-muted mt-1">{item.description}</p>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        {/* Fast Stagger (60ms) */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            Fast Stagger (60ms delay)
          </h2>
          <motion.ul
            variants={fastStaggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {sampleItems.map((item) => (
              <motion.li
                key={item.id}
                variants={subtleFadeUpItem}
                className="p-3 bg-theme-bg rounded-lg border border-theme-border hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <span className="text-sm text-theme-text">{item.title}</span>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        {/* Slow Stagger (150ms) */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            Slow Stagger (150ms delay)
          </h2>
          <motion.ul
            variants={slowStaggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {sampleItems.slice(0, 3).map((item) => (
              <motion.li
                key={item.id}
                variants={fadeUpItem}
                className="p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20"
              >
                <h3 className="font-medium text-theme-text">{item.title}</h3>
                <p className="text-sm text-theme-muted mt-1">{item.description}</p>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        {/* Directional Stagger */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* From Left */}
          <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
            <h2 className="text-lg font-semibold text-theme-text mb-4">
              Fade In from Left
            </h2>
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {sampleItems.slice(0, 4).map((item) => (
                <motion.li
                  key={item.id}
                  variants={fadeInLeftItem}
                  className="p-3 bg-theme-bg rounded-lg border border-theme-border"
                >
                  <span className="text-sm text-theme-text">{item.title}</span>
                </motion.li>
              ))}
            </motion.ul>
          </section>

          {/* From Right */}
          <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
            <h2 className="text-lg font-semibold text-theme-text mb-4">
              Fade In from Right
            </h2>
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {sampleItems.slice(0, 4).map((item) => (
                <motion.li
                  key={item.id}
                  variants={fadeInRightItem}
                  className="p-3 bg-theme-bg rounded-lg border border-theme-border"
                >
                  <span className="text-sm text-theme-text">{item.title}</span>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        </div>

        {/* Grid Stagger */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            Grid Stagger (80ms delay)
          </h2>
          <motion.div
            variants={gridStaggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {sampleItems.map((item) => (
              <motion.div
                key={item.id}
                variants={scaleItem}
                className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 flex items-center justify-center"
              >
                <span className="text-white font-semibold text-center">
                  {item.title}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Social Feed Example */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            Social Feed Example
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {socialPosts.map((post) => (
              <motion.article
                key={post.id}
                variants={fadeUpItem}
                className="p-4 bg-theme-bg rounded-lg border border-theme-border"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {post.author[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-theme-text">{post.author}</h3>
                    <p className="text-sm text-theme-muted mt-1">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button className="flex items-center gap-1 text-theme-muted hover:text-red-500 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-theme-muted hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 text-theme-muted hover:text-green-500 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* Code Example */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">Usage Example</h2>
          <pre className="bg-theme-bg p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-theme-text">{`import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '@/lib/animations/staggerVariants';

<motion.ul
  variants={staggerContainer}
  initial="hidden"
  animate="show"
>
  {items.map((item) => (
    <motion.li key={item.id} variants={fadeUpItem}>
      {item.content}
    </motion.li>
  ))}
</motion.ul>`}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
