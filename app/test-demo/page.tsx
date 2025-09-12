"use client";

export default function TestDemoPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-white mb-4">Test Demo Page</h1>
        <p className="text-white">This is a test to see if the page renders correctly.</p>
        <div className="mt-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl text-white mb-2">Test Card</h2>
          <p className="text-gray-300">If you can see this, the page is working.</p>
        </div>
      </div>
    </div>
  );
}