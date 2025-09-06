"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import { Code2, Book, Webhook, TestTube, Key, Zap, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const apiEndpoints = [
  {
    method: "POST",
    endpoint: "/api/v1/messages/send",
    description: "Send automated message to fan"
  },
  {
    method: "GET",
    endpoint: "/api/v1/analytics/revenue",
    description: "Get revenue analytics data"
  },
  {
    method: "POST",
    endpoint: "/api/v1/content/schedule",
    description: "Schedule content across platforms"
  },
  {
    method: "GET",
    endpoint: "/api/v1/fans/{fanId}",
    description: "Get fan profile and history"
  }
];

const codeExamples = {
  javascript: `import { HuntazeClient } from '@huntaze/sdk';

const client = new HuntazeClient({
  apiKey: process.env.HUNTAZE_API_KEY
});

// Send personalized message
const response = await client.messages.send({
  fanId: 'fan_123',
  message: 'Thanks for your support! 💕',
  platform: 'instagram'
});

console.log('Message sent:', response.messageId);`,
  python: `from huntaze import Client

client = Client(api_key=os.environ["HUNTAZE_API_KEY"])

# Send personalized message
response = client.messages.send(
    fan_id="fan_123",
    message="Thanks for your support! 💕",
    platform="instagram"
)

print(f"Message sent: {response.message_id}")`,
  curl: `curl -X POST https://api.huntaze.com/v1/messages/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fanId": "fan_123",
    "message": "Thanks for your support! 💕",
    "platform": "instagram"
  }'`
};

export default function DevelopersPage() {
  const [activeLanguage, setActiveLanguage] = useState<keyof typeof codeExamples>('javascript');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(codeExamples[activeLanguage]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <HeaderImproved />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-black text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 text-purple-300 text-sm font-medium mb-6">
              <Code2 className="w-4 h-4" />
              <span>Developer API</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Build with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                Huntaze API
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8">
              Integrate creator automation into your apps
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Get API keys
              </Button>
              <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-900">
                Read docs
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container-width">
          <h2 className="text-3xl font-bold text-center mb-12">Quick Start</h2>
          
          {/* Language Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {Object.keys(codeExamples).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang as keyof typeof codeExamples)}
                className={`px-6 py-3 rounded-lg font-medium capitalize transition-all ${
                  activeLanguage === lang
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Code Example */}
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gray-900 rounded-2xl p-6 overflow-hidden">
              <button
                onClick={copyCode}
                className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <pre className="text-gray-300 text-sm overflow-x-auto">
                <code>{codeExamples[activeLanguage]}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container-width">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12">API Reference</h2>
            
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <span className={`px-3 py-1 rounded text-sm font-mono font-medium ${
                    endpoint.method === 'GET' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300">
                    {endpoint.endpoint}
                  </code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
                    {endpoint.description}
                  </p>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <a
                href="/api/docs"
                className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium hover:gap-3 transition-all"
              >
                View full API documentation
                <Zap className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container-width">
          <h2 className="text-3xl font-bold text-center mb-12">Developer Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-black rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <Book className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Comprehensive Docs</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Detailed guides, tutorials, and API references to get you started quickly.
              </p>
            </div>
            
            <div className="bg-white dark:bg-black rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <Webhook className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Real-time Webhooks</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get instant notifications for messages, payments, and fan activities.
              </p>
            </div>
            
            <div className="bg-white dark:bg-black rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <TestTube className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Sandbox Environment</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Test your integration safely with our full-featured sandbox mode.
              </p>
            </div>
            
            <div className="bg-white dark:bg-black rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <Key className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">OAuth 2.0</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Secure authentication with industry-standard OAuth 2.0 flow.
              </p>
            </div>
            
            <div className="bg-white dark:bg-black rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <Code2 className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">SDKs & Libraries</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Official SDKs for JavaScript, Python, PHP, Ruby, and more.
              </p>
            </div>
            
            <div className="bg-white dark:bg-black rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <Zap className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">99.9% Uptime</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enterprise-grade infrastructure with guaranteed uptime SLA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container-width text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start building today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join developers building the future of creator automation
          </p>
          <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
            Get your API keys
          </Button>
        </div>
      </section>

      <FooterImproved />
    </>
  );
}