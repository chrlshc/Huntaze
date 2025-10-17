'use client';

import { useState } from 'react';
import { signIn, signUp, confirmSignUp, signOut, getCurrentUser } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AuthMode = 'signin' | 'signup' | 'confirm';

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { isSignedIn } = await signIn({
        username: email,
        password,
      });
      
      if (isSignedIn) {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      let errorMessage = 'Error signing in';
      if (err.code === 'NotAuthorizedException') {
        errorMessage = 'Incorrect email or password';
      } else if (err.code === 'UserNotFoundException') {
        errorMessage = 'User not found';
      } else if (err.code === 'UserNotConfirmedException') {
        errorMessage = 'Please confirm your account first';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setMode('confirm');
      }
    } catch (err: any) {
      let errorMessage = 'Error signing up';
      if (err.code === 'UsernameExistsException') {
        errorMessage = 'This email is already registered';
      } else if (err.code === 'InvalidPasswordException') {
        errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
      } else if (err.code === 'InvalidParameterException') {
        errorMessage = 'Please enter a valid email address';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: confirmCode,
      });
      
      if (isSignUpComplete) {
        setMode('signin');
        setError('');
      }
    } catch (err: any) {
      setError(err.message || 'Error confirming sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-background border border-border rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === 'signin' && 'Sign In to Huntaze'}
        {mode === 'signup' && 'Create Your Account'}
        {mode === 'confirm' && 'Confirm Your Account'}
      </h2>

      <form
        onSubmit={
          mode === 'signin' ? handleSignIn :
          mode === 'signup' ? handleSignUp :
          handleConfirm
        }
        className="space-y-4"
      >
        {mode !== 'confirm' && (
          <>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </>
        )}

        {mode === 'confirm' && (
          <div className="space-y-1">
            <label
              htmlFor="confirmation-code"
              className="block text-sm font-medium text-foreground"
            >
              Confirmation Code
            </label>
            <Input
              id="confirmation-code"
              type="text"
              placeholder="Confirmation Code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              required
              className="w-full"
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Loading...' : 
            mode === 'signin' ? 'Sign In' :
            mode === 'signup' ? 'Sign Up' :
            'Confirm'
          }
        </Button>
      </form>

      <div className="mt-4 text-center">
        {mode === 'signin' && (
          <button
            onClick={() => setMode('signup')}
            className="text-primary underline"
          >
            Need an account? Sign up
          </button>
        )}
        {mode === 'signup' && (
          <button
            onClick={() => setMode('signin')}
            className="text-primary underline"
          >
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
}
