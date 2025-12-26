import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Huntaze',
  description: 'Terms of Service for Huntaze platform',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300">
              By accessing and using Huntaze ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Huntaze is an AI-powered content management platform that helps creators manage their presence across multiple social media platforms including Instagram, TikTok, Reddit, and adult content platforms. The Service includes content scheduling, analytics, AI-powered assistance, and multi-account management features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              To use certain features of the Service, you must register for an account. When you register for an account, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and accept all risks of unauthorized access</li>
              <li>Notify us immediately if you discover or suspect any security breaches</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Social Media Platform Integration</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you connect your social media accounts to Huntaze:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>You authorize us to access and manage your connected accounts as permitted by each platform's API</li>
              <li>You remain responsible for compliance with each platform's terms of service</li>
              <li>We will only access the permissions you explicitly grant during the OAuth process</li>
              <li>You can revoke access at any time through your account settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Content and Conduct</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You retain ownership of all content you create and share through Huntaze. By using our Service, you agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>You will not use the Service for any illegal purposes</li>
              <li>You will not violate any third-party rights</li>
              <li>You will not attempt to interfere with the proper functioning of the Service</li>
              <li>You are solely responsible for your content and the consequences of posting it</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. AI Features and Generated Content</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Huntaze provides AI-powered features to assist with content creation and management. While we strive for accuracy, AI-generated suggestions and content should be reviewed before use. You are responsible for all content posted to your connected platforms, including AI-assisted content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Privacy and Data Protection</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy. By using Huntaze, you consent to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Subscription and Payments</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Some features of Huntaze require a paid subscription. By subscribing:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>You authorize us to charge your payment method on a recurring basis</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are provided according to our refund policy</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Intellectual Property</h2>
            <p className="text-gray-700 dark:text-gray-300">
              The Huntaze platform, including its design, features, and content (excluding user content), is owned by Huntaze and protected by intellectual property laws. You may not copy, modify, or reverse engineer any part of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-gray-700 dark:text-gray-300">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HUNTAZE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Indemnification</h2>
            <p className="text-gray-700 dark:text-gray-300">
              You agree to indemnify and hold harmless Huntaze, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Termination</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to suspend or terminate your account at any time for violation of these terms. You may also terminate your account at any time. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">14. Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Huntaze operates, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">15. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to modify these terms at any time. We will notify users of material changes via email or through the Service. Your continued use after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">16. Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Email: legal@huntaze.com<br />
              Address: [Your Business Address]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
