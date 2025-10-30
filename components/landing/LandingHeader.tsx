'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface LandingHeaderProps {
  logoSrc?: string;
  showAuthButtons?: boolean;
}

export function LandingHeader({ logoSrc, showAuthButtons = true }: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {logoSrc ? (
              <img src={logoSrc} alt="Huntaze" className="h-8" />
            ) : (
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Huntaze
              </span>
            )}
          </Link>
          
          {/* Desktop Navigation */}
          {showAuthButtons && (
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </nav>
          )}
          
          {/* Mobile Menu Button */}
          {showAuthButtons && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-indigo-600"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && showAuthButtons && (
        <div id="mobile-menu" className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-4 py-4 space-y-3" aria-label="Mobile navigation">
            <Link
              href="/auth/login"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-center transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
