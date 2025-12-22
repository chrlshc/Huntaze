export type AutomationStatus = 'active' | 'paused' | 'draft';

export interface MockAutomationFlow {
  id: string;
  userId: number;
  name: string;
  description: string | null;
  status: AutomationStatus;
  steps: Array<{ id: string; type: 'trigger' | 'condition' | 'action'; name: string; config: Record<string, unknown> }>;
  createdAt: string;
  updatedAt: string;
}

export const mockAutomations: MockAutomationFlow[] = [
  {
    id: 'auto_1',
    userId: 1,
    name: 'Welcome New Subscribers',
    description: null,
    status: 'active',
    steps: [
      { id: 't1', type: 'trigger', name: 'new_subscriber', config: {} },
      { id: 'a1', type: 'action', name: 'send_message', config: { template: 'Welcome 💕' } },
    ],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'auto_2',
    userId: 1,
    name: 'Re-engage Inactive Fans',
    description: null,
    status: 'active',
    steps: [
      { id: 't1', type: 'trigger', name: 'subscription_expiring', config: { days: 30 } },
      { id: 'a1', type: 'action', name: 'send_message', config: { template: 'We miss you 💕' } },
    ],
    createdAt: '2024-12-02T10:00:00Z',
    updatedAt: '2024-12-02T10:00:00Z',
  },
  {
    id: 'auto_3',
    userId: 1,
    name: 'Subscription Expiring Reminder',
    description: null,
    status: 'paused',
    steps: [
      { id: 't1', type: 'trigger', name: 'subscription_expiring', config: { days: 3 } },
      { id: 'a1', type: 'action', name: 'send_message', config: { template: 'Your sub expires soon' } },
    ],
    createdAt: '2024-12-03T10:00:00Z',
    updatedAt: '2024-12-03T10:00:00Z',
  },
  {
    id: 'auto_4',
    userId: 1,
    name: 'Birthday Discount',
    description: null,
    status: 'draft',
    steps: [
      { id: 't1', type: 'trigger', name: 'purchase_completed', config: { when: 'birthday' } },
      { id: 'a1', type: 'action', name: 'create_offer', config: { discountType: 'percentage', discountValue: 20 } },
    ],
    createdAt: '2024-12-04T10:00:00Z',
    updatedAt: '2024-12-04T10:00:00Z',
  },
];

