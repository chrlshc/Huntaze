import ForgotPasswordFlow from '@/components/auth/ForgotPasswordFlow';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md p-8">
        <ForgotPasswordFlow />
      </div>
    </div>
  );
}