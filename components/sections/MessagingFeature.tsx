'use client';
import PhoneMockup from '@/components/mockups/PhoneMockup';
import ChatAnimation from '@/components/mockups/ChatAnimation';
import { Check, MessageCircle, TrendingUp, Zap, DollarSign } from 'lucide-react';

const FloatingNotification = ({ text, amount }: { text: string; amount: string }) => {
  return (
    <div className="absolute top-20 -right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{text}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{amount}</div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon: Icon }: any) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};

export default function MessagingFeature() {
  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        {/* Feature cards */}
        <div className="space-y-4">
          <FeatureCard 
            icon={MessageCircle}
            title="AI-powered responses"
            description="Convert 3x more with messages that sound exactly like you, available 24/7."
          />
          <FeatureCard 
            icon={TrendingUp}
            title="Grow across platforms"
            description="Dominate OnlyFans, Instagram, TikTok, and Reddit with smart automation."
          />
          <FeatureCard 
            icon={Zap}
            title="Built for conversions"
            description="Our AI learns what works and optimizes every message for maximum earnings."
          />
        </div>
      </div>

      {/* Phone mockup */}
      <div className="relative">
        <PhoneMockup>
          <ChatAnimation />
        </PhoneMockup>
        <FloatingNotification text="New subscriber!" amount="$49.99/month" />
      </div>
    </div>
  );
}