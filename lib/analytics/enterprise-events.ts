// Enterprise Analytics Events
// Track high-intent actions for enterprise prospects

export const trackingEvents = {
  // Engagement signals (Low intent)
  demo_started: { 
    value: 10,
    category: 'engagement',
    label: 'Demo interaction started'
  },
  demo_completed: { 
    value: 50,
    category: 'engagement',
    label: 'Full demo completed' 
  },
  capability_expanded: { 
    value: 5,
    category: 'engagement',
    label: 'Platform capability explored'
  },
  case_study_viewed: { 
    value: 20,
    category: 'engagement',
    label: 'Case study opened'
  },
  
  // High-intent actions
  contact_sales_clicked: { 
    value: 100,
    category: 'conversion',
    label: 'Contact sales CTA clicked'
  },
  calendar_opened: { 
    value: 150,
    category: 'conversion',
    label: 'Scheduling calendar opened'
  },
  meeting_booked: { 
    value: 500,
    category: 'conversion',
    label: 'Sales meeting scheduled'
  },
  roi_calculator_used: { 
    value: 75,
    category: 'conversion',
    label: 'ROI calculator engaged'
  },
  
  // Technical evaluation signals
  api_docs_accessed: { 
    value: 30,
    category: 'technical',
    label: 'API documentation viewed'
  },
  security_whitepaper_downloaded: { 
    value: 200,
    category: 'technical',
    label: 'Security whitepaper downloaded'
  },
  sandbox_activated: { 
    value: 300,
    category: 'technical',
    label: 'Interactive sandbox mode enabled'
  },
  integration_docs_viewed: {
    value: 40,
    category: 'technical',
    label: 'Integration documentation accessed'
  },
  
  // Qualification events
  revenue_tier_selected: {
    value: 50,
    category: 'qualification',
    label: 'Revenue tier identified'
  },
  pain_point_selected: {
    value: 30,
    category: 'qualification',
    label: 'Primary pain point identified'
  },
  enterprise_tier_qualified: {
    value: 250,
    category: 'qualification',
    label: 'Qualified as enterprise prospect'
  },
  
  // ROI Calculator specific
  roi_calculation_completed: {
    value: 100,
    category: 'roi',
    label: 'ROI calculation completed'
  },
  roi_report_requested: {
    value: 150,
    category: 'roi',
    label: 'Detailed ROI report requested'
  }
}

// Track event with GA4 or your analytics provider
export const trackEnterpriseEvent = (
  eventName: keyof typeof trackingEvents,
  additionalData?: Record<string, any>
) => {
  const event = trackingEvents[eventName]
  
  if (!event) {
    console.warn(`Unknown tracking event: ${eventName}`)
    return
  }

  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...additionalData
    })
  }

  // Segment/Amplitude/Mixpanel
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(eventName, {
      category: event.category,
      label: event.label,
      value: event.value,
      ...additionalData
    })
  }

  // Custom tracking endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        properties: {
          ...event,
          ...additionalData,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer
        }
      })
    }).catch(console.error)
  }
}

// Revenue-based lead scoring
export const calculateLeadScore = (data: {
  monthlyRevenue?: string
  painPoint?: string
  teamSize?: string
  engagementEvents?: string[]
}) => {
  let score = 0

  // Revenue tier scoring
  const revenueScores: Record<string, number> = {
    '10-50k': 20,
    '50-200k': 40,
    '200k-1m': 70,
    '1m+': 100
  }
  score += revenueScores[data.monthlyRevenue || ''] || 0

  // Pain point scoring
  const painPointScores: Record<string, number> = {
    'scaling-conversations': 30,
    'revenue-optimization': 40,
    'platform-migration': 20,
    'custom-integration': 25
  }
  score += painPointScores[data.painPoint || ''] || 0

  // Team size scoring
  const teamScores: Record<string, number> = {
    'solo': 10,
    '2-5': 20,
    '6-20': 30,
    '20+': 40
  }
  score += teamScores[data.teamSize || ''] || 0

  // Engagement scoring
  if (data.engagementEvents) {
    data.engagementEvents.forEach(event => {
      score += trackingEvents[event as keyof typeof trackingEvents]?.value || 0
    })
  }

  return {
    score,
    tier: score >= 200 ? 'hot' : score >= 100 ? 'warm' : 'cold',
    routing: score >= 150 ? 'enterprise-team' : 'growth-team'
  }
}

// Session recording trigger
export const shouldRecordSession = (events: string[]) => {
  const highValueEvents = [
    'contact_sales_clicked',
    'meeting_booked',
    'security_whitepaper_downloaded',
    'sandbox_activated',
    'roi_report_requested'
  ]
  
  return events.some(event => highValueEvents.includes(event))
}

// Export for use in components
export default {
  track: trackEnterpriseEvent,
  events: trackingEvents,
  calculateLeadScore,
  shouldRecordSession
}