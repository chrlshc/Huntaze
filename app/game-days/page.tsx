/**
 * Game Days Main Page
 * Central hub for Game Day management and execution
 */

import { Metadata } from 'next';
import GameDayDashboard from '@/components/game-days/GameDayDashboard';

export const metadata: Metadata = {
  title: 'Game Days - Disaster Recovery Testing',
  description: 'Structured chaos engineering and disaster recovery testing platform'
};

export default function GameDaysPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <GameDayDashboard />
      </div>
    </div>
  );
}