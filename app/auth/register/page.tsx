import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Register | Huntaze',
  description: 'Create your Huntaze account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Create your account
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Get started with Huntaze today
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
