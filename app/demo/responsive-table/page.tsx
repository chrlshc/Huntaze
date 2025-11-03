'use client';

import { ResponsiveTable } from '@/components/ui/ResponsiveTable';

interface Fan {
  id: number;
  name: string;
  email: string;
  status: string;
  revenue: string;
  lastActive: string;
}

export default function ResponsiveTableDemo() {
  const fans: Fan[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      status: 'Active',
      revenue: '$1,250',
      lastActive: '2 hours ago',
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      status: 'Active',
      revenue: '$890',
      lastActive: '5 hours ago',
    },
    {
      id: 3,
      name: 'Emma Williams',
      email: 'emma.w@example.com',
      status: 'Inactive',
      revenue: '$2,100',
      lastActive: '3 days ago',
    },
    {
      id: 4,
      name: 'James Rodriguez',
      email: 'james.r@example.com',
      status: 'Active',
      revenue: '$650',
      lastActive: '1 hour ago',
    },
    {
      id: 5,
      name: 'Olivia Martinez',
      email: 'olivia.m@example.com',
      status: 'Active',
      revenue: '$1,800',
      lastActive: '30 minutes ago',
    },
  ];

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'status',
      label: 'Status',
      render: (fan: Fan) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            fan.status === 'Active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {fan.status}
        </span>
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (fan: Fan) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {fan.revenue}
        </span>
      ),
    },
    {
      key: 'lastActive',
      label: 'Last Active',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Responsive Table Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Resize your browser to see the table transform into cards on mobile
            (below 768px width)
          </p>
        </div>

        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fan List
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your fans and track their activity
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <ResponsiveTable
              columns={columns}
              data={fans}
              keyExtractor={(fan) => fan.id}
            />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            How to Use
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>Desktop (≥768px):</strong> Traditional table layout with
              hover effects
            </p>
            <p>
              <strong>Mobile (&lt;768px):</strong> Card-based layout with
              data-label attributes
            </p>
            <p className="mt-4">
              <strong>Usage:</strong> Add the <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">responsive-table</code> class to any table, and add{' '}
              <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">data-label</code> attributes to td elements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
