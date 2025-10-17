import AuthForm from '@/components/auth/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Huntaze</h1>
          <p className="text-gray-400">Connectez-vous pour continuer</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}