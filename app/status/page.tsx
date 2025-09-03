import { Metadata } from 'next'
import { CheckCircle, AlertCircle, Activity, Shield, Database, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'System Status - Huntaze',
  description: 'Real-time status of Huntaze services and infrastructure',
}

const services = [
  {
    name: 'AI Chat Engine',
    status: 'operational',
    uptime: '99.9%',
    icon: Zap,
    description: 'AI-powered chat responses'
  },
  {
    name: 'Analytics Platform',
    status: 'operational',
    uptime: '99.8%',
    icon: Activity,
    description: 'Revenue and performance tracking'
  },
  {
    name: 'Content Scheduler',
    status: 'operational',
    uptime: '99.9%',
    icon: Database,
    description: 'Automated posting system'
  },
  {
    name: 'Security Services',
    status: 'operational',
    uptime: '100%',
    icon: Shield,
    description: 'Authentication and data protection'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'text-green-600 dark:text-green-400'
    case 'degraded':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'outage':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'bg-green-100 dark:bg-green-900/30'
    case 'degraded':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'outage':
      return 'bg-red-100 dark:bg-red-900/30'
    default:
      return 'bg-gray-100 dark:bg-gray-900/30'
  }
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            System Status
          </h1>
          <p className="text-lg text-gray-700 dark:text-[var(--text-secondary-dark)] max-w-2xl mx-auto">
            Current status of Huntaze services. All times in PST.
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Systems Operational
                </h2>
                <p className="text-sm text-gray-600 dark:text-[var(--text-secondary-dark)]">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-[var(--text-secondary-dark)]">Overall Uptime</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <div key={service.name} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <service.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-[var(--text-secondary-dark)]">{service.description}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(service.status)} ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-[var(--text-secondary-dark)]">Uptime (30 days)</span>
                <span className="font-medium text-gray-900 dark:text-white">{service.uptime}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Incidents */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Incidents</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-[var(--text-secondary-dark)]">
              No incidents reported in the last 30 days
            </p>
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Scheduled Maintenance</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Next Maintenance Window</h3>
            </div>
            <p className="text-gray-700 dark:text-[var(--text-secondary-dark)] mb-2">
              <strong>Date:</strong> Sunday, January 12, 2025
            </p>
            <p className="text-gray-700 dark:text-[var(--text-secondary-dark)] mb-2">
              <strong>Time:</strong> 2:00 AM - 4:00 AM PST
            </p>
            <p className="text-gray-700 dark:text-[var(--text-secondary-dark)]">
              <strong>Impact:</strong> Brief interruptions possible during database upgrades
            </p>
          </div>
        </div>

        {/* Subscribe to Updates */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-700 dark:text-[var(--text-secondary-dark)] mb-6">
              Get notified about system status changes and planned maintenance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Subscribe to Updates
              </button>
              <a href="/api/status" className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                API Status
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}