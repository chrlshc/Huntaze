import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Huntaze',
  description: 'Huntaze Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: December 23, 2024</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Huntaze (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We collect information that you provide directly to us:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Account information (email, name)</li>
              <li>Social media account connections (Instagram, TikTok, OnlyFans)</li>
              <li>OAuth tokens for connected platforms</li>
              <li>Content and analytics data from connected platforms</li>
              <li>Usage data and preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Display analytics and insights from your connected accounts</li>
              <li>Enable content scheduling and publishing features</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as your account is active or as needed 
              to provide you services. OAuth tokens are stored securely and can be revoked at any time 
              by disconnecting your accounts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We may share your information only:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>With service providers who assist in our operations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Disconnect connected accounts at any time</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Deletion</h2>
            <p className="text-gray-700 mb-4">
              To request deletion of your data:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4">
              <li>Go to Settings → Connected Accounts → Disconnect all accounts</li>
              <li>Or email us at <a href="mailto:support@huntaze.com" className="text-blue-600 hover:underline">support@huntaze.com</a> with subject &quot;Data Deletion Request&quot;</li>
            </ol>
            <p className="text-gray-700">
              We will process your request within 30 days and delete all associated tokens and data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal 
              information, including encryption of sensitive data and secure storage of OAuth tokens.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-700">
              Email: <a href="mailto:support@huntaze.com" className="text-blue-600 hover:underline">support@huntaze.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
