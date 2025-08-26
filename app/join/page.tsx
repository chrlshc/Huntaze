"use client";

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function JoinPage() {
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [socialProfile, setSocialProfile] = useState('');
  const [contentType, setContentType] = useState('');
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setMessage('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          handle_ig: socialProfile || undefined,
          niche: contentType || undefined,
          consent: consent || undefined,
        }),
      });
      if (res.ok) {
        setState('success');
        setMessage('Welcome aboard! Check your email for next steps.');
        setEmail('');
        setSocialProfile('');
        setContentType('');
        setConsent(false);
      } else if (res.status === 422) {
        const data = await res.json();
        setState('error');
        setMessage('Please check your input: ' + (data.error || 'Invalid data'));
      } else if (res.status === 429) {
        setState('error');
        setMessage('Too many requests. Please try again later.');
      } else {
        const data = await res.json();
        setState('error');
        setMessage(data.error || 'An unexpected error occurred.');
      }
    } catch (err) {
      setState('error');
      setMessage('Network error. Please try again later.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-black pt-24 pb-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6 sm:p-8 rounded-xl shadow-xl border dark:border-gray-800">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Get Early Access
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
            Be among the first to experience Huntaze's AI-powered platform
          </p>
          
          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email<span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                htmlFor="socialProfile"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Social profile (optional)
              </label>
              <Input
                id="socialProfile"
                type="text"
                value={socialProfile}
                onChange={(e) => setSocialProfile(e.target.value)}
                placeholder="@yourprofile or link"
                className="w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                htmlFor="contentType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Content type (optional)
              </label>
              <Input
                id="contentType"
                type="text"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                placeholder="e.g. travel, fashion, tech"
                className="w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex items-start">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="h-4 w-4 text-purple-600 dark:text-purple-500 border-gray-300 dark:border-gray-700 rounded focus:ring-purple-500 dark:focus:ring-purple-400 mt-0.5"
              />
              <label
                htmlFor="consent"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                I'd like to receive updates about new features and special offers from Huntaze
              </label>
            </div>
            <Button
              type="submit"
              disabled={state === 'loading'}
              className="w-full bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {state === 'loading' ? 'Submitting...' : 'Join waitlist'}
            </Button>
            <div
              aria-live="polite"
              className="text-sm text-center mt-4"
            >
              {message && (
                <p
                  className={
                    state === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }
                >
                  {message}
                </p>
              )}
            </div>
          </form>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-950 text-gray-500">or</span>
            </div>
          </div>

          {/* OAuth Options */}
          <div className="space-y-3">
            <button
              onClick={() => console.log('Google sign in')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <FaGoogle className="w-5 h-5 text-red-500" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Sign up with Google</span>
            </button>

            <button
              onClick={() => console.log('Apple sign in')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <FaApple className="w-5 h-5 text-black dark:text-white" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Sign up with Apple</span>
            </button>
            
            <button
              onClick={() => console.log('Sign up with Facebook')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <span className="w-5 h-5 bg-blue-600 text-white font-bold rounded flex items-center justify-center text-sm">f</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Sign up with Facebook</span>
            </button>
          </div>
        </Card>
        
      </div>
    </div>
  );
}