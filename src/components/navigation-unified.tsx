'use client';

import Link from 'next/link';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import './nav-styles.css';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-surface-light/95 dark:bg-surface/95 backdrop-blur-lg shadow-md' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-content-primary">Huntaze</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex main-nav">
            <Link
              href="/pricing"
              className="main-nav-item"
            >
              Pricing
            </Link>
            <Link
              href="/#features"
              className="main-nav-item"
            >
              Features
            </Link>
            <Link
              href="/#testimonials"
              className="main-nav-item"
            >
              Success Stories
            </Link>
            <Link
              href="/#about"
              className="main-nav-item"
            >
              About
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth"
              className="px-4 py-2 text-content-secondary hover:text-content-primary transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth?mode=signup"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="mobile-menu" role="navigation" aria-label="Mobile navigation">
          <div className="mobile-menu-content">
            <Link
              href="/pricing"
              className="mobile-menu-item"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#features"
              className="mobile-menu-item"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#testimonials"
              className="mobile-menu-item"
              onClick={() => setIsMenuOpen(false)}
            >
              Success Stories
            </Link>
            <Link
              href="/#about"
              className="mobile-menu-item"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-4 space-y-3">
              <Link
                href="/auth"
                className="block px-4 py-3 text-center border border-border-light dark:border-border rounded-lg font-medium hover:bg-surface-hover-light dark:hover:bg-surface-hover transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth?mode=signup"
                className="btn-primary w-full justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sparkles className="w-4 h-4" />
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}