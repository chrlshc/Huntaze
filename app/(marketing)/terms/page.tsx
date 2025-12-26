import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Huntaze',
  description: 'Huntaze Terms of Service - Rules and guidelines for using our platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: December 23, 2024</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using Huntaze (&quot;Service&quot;), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Huntaze is a social media management platform that helps content creators manage their 
              presence across multiple platforms including Instagram, TikTok, and OnlyFans. Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Analytics and insights dashboard</li>
              <li>Content scheduling and publishing</li>
              <li>Fan engagement tools</li>
              <li>Revenue tracking and optimization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To use our Service, you must create an account and provide accurate information. 
              You are responsible for maintaining the security of your account credentials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
            <p className="text-gray-700 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Use the Service in compliance with all applicable laws</li>
              <li>Not violate the terms of service of connected platforms</li>
              <li>Not use the Service for any illegal or unauthorized purpose</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Third-Party Platforms</h2>
            <p className="text-gray-700 mb-4">
              Our Service integrates with third-party platforms (Instagram, TikTok, OnlyFans). 
              Your use of these platforms is subject to their respective terms of service. 
              We are not responsible for the actions or policies of these third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              You retain ownership of your content. By using our Service, you grant us a limited 
              license to process and display your content as necessary to provide the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              Huntaze is provided &quot;as is&quot; without warranties of any kind. We are not liable for 
              any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account at any time for violations of these terms. 
              You may also terminate your account at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may update these terms from time to time. We will notify you of significant changes 
              by posting a notice on our website or sending you an email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-700">
              For questions about these Terms, contact us at{' '}
              <a href="mailto:support@huntaze.com" className="text-blue-600 hover:underline">
                support@huntaze.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
