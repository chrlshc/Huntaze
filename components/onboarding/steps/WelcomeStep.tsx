"use client";

import { Sparkles, Shield, Users, TrendingUp } from "lucide-react";

export function WelcomeStep() {

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold">Welcome to Huntaze! 🎉</h2>
        
        <p className="text-gray-600 max-w-2xl mx-auto">
          We’re excited to have you. Huntaze is your all‑in‑one platform to automate 
          and optimize your social presence with AI.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-6 space-y-3">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold">Guaranteed compliance</h3>
          <p className="text-sm text-gray-600">
            Automatically respect each platform’s rules
          </p>
        </div>

        <div className="bg-pink-50 rounded-lg p-6 space-y-3">
          <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold">Personalized AI</h3>
          <p className="text-sm text-gray-600">
            A virtual teammate that learns your style and audience
          </p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-6 space-y-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold">Optimized growth</h3>
          <p className="text-sm text-gray-600">
            Maximize your revenue with smart strategies
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
        <h3 className="font-semibold mb-3">This onboarding covers:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Compliance and best‑practices training
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Setting up your GDPR privacy preferences
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Securely connecting your social platforms
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Personalizing your AI assistant
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Configuring governance settings
          </li>
        </ul>
      </div>

      <p className="text-center text-sm text-gray-500">
        Estimated time: 15–20 minutes • Your data is secure and encrypted
      </p>
    </div>
  );
}
