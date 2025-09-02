'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, DollarSign, MessageSquare, BarChart3 } from 'lucide-react';

export default function TestDesignPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">New Design System</h1>
        
        {/* Buttons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="flex gap-4 flex-wrap">
            <Button variant="gradient">Gradient Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="default">Default Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Elevated Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="elevated-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-green-600">+12%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">$12,450</p>
              <p className="text-sm text-gray-600">Monthly revenue</p>
            </div>

            <div className="elevated-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-green-600">+8%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-gray-600">Fans actifs</p>
            </div>

            <div className="elevated-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-pink-100 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-green-600">+24%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">89%</p>
              <p className="text-sm text-gray-600">Response rate</p>
            </div>

            <div className="elevated-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-green-600">+15%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">92%</p>
              <p className="text-sm text-gray-600">Automation AI</p>
            </div>
          </div>
        </div>

        {/* Form Example */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Form</h2>
          <Card className="max-w-md">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input type="email" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Type your message..."
                />
              </div>
              <Button variant="gradient" className="w-full">
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* Large Card */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Large Card</h2>
          <div className="elevated-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Top Fans</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                      <div>
                        <p className="font-medium text-gray-900">Fan #{i}</p>
                        <p className="text-sm text-gray-500">Active 2 min ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">$456</p>
                      <p className="text-sm text-green-600">+12%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
