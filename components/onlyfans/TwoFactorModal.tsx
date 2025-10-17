'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Shield, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TwoFactorModalProps {
  isOpen: boolean;
  sessionId: string;
  email: string;
  onCodeSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
}

export function TwoFactorModal({
  isOpen,
  sessionId,
  email,
  onCodeSubmit,
  onCancel
}: TwoFactorModalProps) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onCancel]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = code.split('');
    newCode[index] = value;
    setCode(newCode.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    setCode(digits);

    // Focus last input or next empty one
    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCodeSubmit(code);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setCode('');
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <DialogTitle>Two-Factor Authentication</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Enter the 6-digit code from your authenticator app or SMS to continue 
            connecting your OnlyFans account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Code sent to: {email.replace(/(.{3}).*(@.*)/, '$1***$2')}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Verification Code</Label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code[index] || ''}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-lg font-mono"
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Time remaining: {formatTime(timeLeft)}</span>
            <span className="text-xs">Session: {sessionId.slice(-6)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || code.length !== 6}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-2">
          Didn't receive a code?{' '}
          <button 
            className="text-blue-600 hover:underline"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Usage in OnlyFans connection flow:
// <TwoFactorModal
//   isOpen={show2FA}
//   sessionId={sessionId}
//   email={userEmail}
//   onCodeSubmit={async (code) => {
//     await fetch('/api/onlyfans/2fa', {
//       method: 'POST',
//       body: JSON.stringify({ sessionId, code })
//     });
//   }}
//   onCancel={() => setShow2FA(false)}
// />