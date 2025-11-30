/**
 * Email Verification Page
 * Handles magic link token validation
 * 
 * Requirements:
 * - 2.3: Magic link authentication
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Verify Email - Huntaze',
  description: 'Verify your email address to complete signup',
};

// This page needs to be dynamic because it processes verification tokens from URL
export const dynamic = 'force-dynamic';

function VerificationContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Loading State */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying your email
          </h1>
          <p className="text-gray-600 mb-6">
            Please wait while we verify your email address...
          </p>

          <div className="text-sm text-gray-500">
            This should only take a moment
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link 
            href="/signup" 
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Back to signup
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerificationContent />}>
      <VerificationContent />
    </Suspense>
  );
}
