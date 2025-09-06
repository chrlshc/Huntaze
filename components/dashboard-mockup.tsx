"use client";

import { TrendingUp, Users, DollarSign, MessageSquare } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="w-full bg-[#0F0F10] rounded-xl p-6 border border-[#2A2A2A]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#EEEFF1]">Revenue Overview</h3>
          <p className="text-sm text-[#9CA3AF]">Last 30 days</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#EEEFF1]">$24,892</span>
          <span className="text-sm text-[#00D9FF] flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +42%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#151516] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-[#635BFF]" />
            <span className="text-sm text-[#9CA3AF]">Messages</span>
          </div>
          <p className="text-xl font-semibold text-[#EEEFF1]">12,847</p>
          <p className="text-xs text-[#00D9FF]">+128% vs last month</p>
        </div>
        
        <div className="bg-[#151516] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#635BFF]" />
            <span className="text-sm text-[#9CA3AF]">Active Fans</span>
          </div>
          <p className="text-xl font-semibold text-[#EEEFF1]">3,241</p>
          <p className="text-xs text-[#00D9FF]">+47 today</p>
        </div>
        
        <div className="bg-[#151516] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-[#635BFF]" />
            <span className="text-sm text-[#9CA3AF]">Avg Order</span>
          </div>
          <p className="text-xl font-semibold text-[#EEEFF1]">$127</p>
          <p className="text-xs text-[#00D9FF]">+$23 increase</p>
        </div>
        
        <div className="bg-[#151516] rounded-lg p-4 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#635BFF]" />
            <span className="text-sm text-[#9CA3AF]">Conversion</span>
          </div>
          <p className="text-xl font-semibold text-[#EEEFF1]">31.4%</p>
          <p className="text-xs text-[#00D9FF]">+5.2% vs avg</p>
        </div>
      </div>

      {/* Chart Area (placeholder) */}
      <div className="bg-[#151516] rounded-lg p-6 border border-[#2A2A2A] h-48 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-[#635BFF] rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-[#635BFF] rounded-full animate-pulse delay-75" />
            <div className="w-3 h-3 bg-[#635BFF] rounded-full animate-pulse delay-150" />
          </div>
          <p className="text-sm text-[#9CA3AF]">Real-time revenue tracking</p>
        </div>
      </div>
    </div>
  );
}