import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Deletion | Huntaze',
  description: 'How to delete your data from Huntaze',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Deletion Instructions</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Delete Your Data</h2>
          <p className="text-blue-800">
            Follow the steps below to request deletion of your data from Huntaze.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Option 1: Self-Service (Recommended)</h3>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>Log in to your Huntaze account</li>
              <li>Go to <strong>Settings</strong> → <strong>Connected Accounts</strong></li>
              <li>Click <strong>Disconnect</strong> next to Instagram or any connected platform</li>
              <li>To delete your entire account, go to <strong>Settings</strong> → <strong>Account</strong> → <strong>Delete Account</strong></li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Option 2: Email Request</h3>
            <p className="text-gray-700 mb-3">
              Send an email to request data deletion:
            </p>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-gray-800"><strong>To:</strong> <a href="mailto:support@huntaze.com" className="text-blue-600 hover:underline">support@huntaze.com</a></p>
              <p className="text-gray-800"><strong>Subject:</strong> Data Deletion Request</p>
              <p className="text-gray-800 mt-2"><strong>Include:</strong></p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Your account email address</li>
                <li>Your Instagram username (if applicable)</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">What We Delete</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>OAuth tokens and access credentials</li>
              <li>Profile information from connected platforms</li>
              <li>Analytics and insights data</li>
              <li>Content metadata and scheduling data</li>
              <li>Account preferences and settings</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Processing Time</h3>
            <p className="text-gray-700">
              We process all data deletion requests within <strong>30 days</strong>. 
              You will receive a confirmation email once your data has been deleted.
            </p>
          </section>

          <section className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Questions?</h3>
            <p className="text-gray-700">
              Contact us at <a href="mailto:support@huntaze.com" className="text-blue-600 hover:underline">support@huntaze.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
