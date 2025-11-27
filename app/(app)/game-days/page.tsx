/**
 * Game Days Main Page
 * Central hub for Game Day management and execution
 */

'use client';

import GameDayDashboard from '@/components/game-days/GameDayDashboard';

export default function GameDaysPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <GameDayDashboard />
      </div>
    </div>
  );
}