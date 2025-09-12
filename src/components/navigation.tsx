'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <Link
          href="/pricing"
          className="text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          Pricing
        </Link>
        <Link
          href="/#solutions"
          className="text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          Features
        </Link>
        <Link
          href="/#testimonials"
          className="text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          Success Stories
        </Link>
        <Link
          href="/#about"
          className="text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          About
        </Link>
        <Button asChild className="btn-primary">
          <Link href="/join">Get Early Access</Link>
        </Button>
      </nav>
      
      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-text-primary"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 right-0 bg-background-elevated border-b border-border shadow-lg">
          <div className="flex flex-col p-6 space-y-4">
            <Link
              href="/pricing"
              className="text-text-primary hover:bg-primary/10 transition-colors font-medium px-2 py-1 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#solutions"
              className="text-text-primary hover:bg-primary/10 transition-colors font-medium px-2 py-1 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#testimonials"
              className="text-text-primary hover:bg-primary/10 transition-colors font-medium px-2 py-1 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              Success Stories
            </Link>
            <Link
              href="/#about"
              className="text-text-primary hover:bg-primary/10 transition-colors font-medium px-2 py-1 rounded"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Button asChild className="btn-primary w-full">
              <Link href="/join">Get Early Access</Link>
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}
