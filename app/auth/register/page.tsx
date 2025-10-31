import React from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your journey with Huntaze today"
    >
      <RegisterForm />
    </AuthCard>
  );
}
