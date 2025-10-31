import React from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your Huntaze account"
    >
      <LoginForm />
    </AuthCard>
  );
}
